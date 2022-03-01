# Github Action Report Artifact

This Github Action is developed to get the data related to an artifact in a previous workflow. The idea is that, after 
using `@actions/upload-artifact@v2` to upload an artifact in a workflow, you trigger another workflow using `on: workflow_run`
which then includes this action, and then you can do different things:

- Get the artifact ID and artifact URL as an output to use it in another action;
- Comment on the PR with the link to download the artifact;
- Adding a commit status to easily download the artifact;

More documentation will be added soon. Stay tuned!
