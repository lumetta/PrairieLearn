# Workspaces

Workspaces allow students to work in persistent remote containers via in-browser frontends such as VS Code. The remote containers are configured by instructors to provide custom, uniform environments per question. Workspace questions are integrated with the standard PrairieLearn autograding pipeline.

## Setting up

### `info.json`

The question's `info.json` should contain a `workspaceOptions` dictionary:

* `image`: Dockerhub image that will be used to serve this question
* `port`: port number used in the Docker image
* `gradedFiles`: list of files or directories that will be copied for grading
* `args`: command line arguments to pass to the Docker

A full `info.json` file should look something like:

```json
{
    "uuid": "...",
    "title": "...",
    "topic": "...",
    "tags": [...],
    "type": "v3",
    "workspaceOptions": {
        "image": "prairielearn/workspace-vscode",
        "port": 15000,
        "args": "--auth none",
        "gradedFiles": [
            "starter_code.h",
            "starter_code.c"
        ]
    }
}
```
