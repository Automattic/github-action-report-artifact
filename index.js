const core = require( '@actions/core' );
const github = require( '@actions/github' );


async function run() {
		const githubToken = core.getInput( 'github-token' );
		const artifactName = core.getInput('artifact-name');
		const reportOn = core.getInput('report-on');
		const commitStatusContext = core.getInput('context');
		const message = core.getInput('message');
		const octokit = github.getOctokit( githubToken );

		const { context } = github;

		const { owner, repo } = context.repo;

		if (!context.payload.workflow_run) {
			throw new Error("This action must run on workflow that runs on: workflow_run, so it can get the artifact list properly");
		}

		const { id: run_id, check_suite_id, head_sha: sha, pull_requests } = context.payload.workflow_run;

		const artifactsResponse = await octokit.rest.actions.listWorkflowRunArtifacts(
			{
				owner,
				repo,
				run_id,
			}
		);


		const artifactResult = artifactsResponse.data.artifacts.find(
			( artifact ) => {
				return artifact.name === artifactName;
			}
		);


		const artifactFound = !!artifactResult;

		const artifactId = artifactFound ? artifactResult.id : "ID not found";
		const artifactUrl = `https://github.com/${owner}/${repo}/suites/${check_suite_id}/artifacts/${artifactId}`;


		const artifactData = {
			id: artifactId,
			name: artifactName,
			url: artifactUrl,
			commit: sha
		}

		switch ( reportOn ) {
			case "commit_status":
				await octokit.rest.repos.createCommitStatus( {
					owner,
					repo,
					sha,
					state: artifactFound ? 'success' : 'failure',
					target_url: artifactUrl,
					description: formatMessage(artifactFound ? message : 'No artifact found with the name "{name}"', artifactData),
					context: formatMessage(commitStatusContext, artifactData),
				} );
				break;
			case "pull_request":
				if (!pull_requests.length) {
					throw new Error("No pull requests associated with the workflow_run");
				}
				await octokit.rest.issues.createComment({
					owner,
					repo,
					issue_number: pull_requests[0].number,
					body: formatMessage(message, artifactData),
				});
				break;
			case "none":
				break;
		}

		if (artifactFound) {
			core.setOutput( 'artifact_id', artifactId );
			core.setOutput( 'artifact_url', artifactUrl );
		} else {
			throw new Error(`No artifact found with the name "${artifactName}"`);
		}
}

function formatMessage(message, obj) {
	const keys = Object.keys(obj);
	const regex = new RegExp("{("+keys.join("|")+")}", "g");
	return message.replace(regex, function(match, key) {
		return obj[key];
	})
}

function reportErrors(error) {
	core.info(error);
	core.setFailed(error.message);
}


run().catch(reportErrors);
