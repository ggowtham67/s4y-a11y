import * as core from '@actions/core'
import * as github from '@actions/github'

type FileStatus = 'added' | 'modified' | 'removed' | 'renamed'

async function run(): Promise<void> {
  try {
    // Create GitHub client with the API token.
    const token = core.getInput('token', {
      required: true
    })

    const octokit = github.getOctokit(token)

    // Debug log the payload.
    core.debug(`Payload keys: ${Object.keys(github.context.payload)}`)

    // Get event name.
    const eventName = github.context.eventName

    // Define the base and head commits to be extracted from the payload.
    let base: string | undefined
    let head: string | undefined

    switch (eventName) {
      case 'pull_request':
        base = github.context.payload.pull_request?.base?.sha
        head = github.context.payload.pull_request?.head?.sha
        break
      case 'push':
        base = github.context.payload.before
        head = github.context.payload.after
        break
      default:
        core.setFailed(
          `This action only supports pull requests and pushes, ${github.context.eventName} events are not supported. Please submit an issue on this action's GitHub repo if you believe this in correct.`
        )
    }

    // Log the base and head commits
    core.info(`Base commit: ${base}`)
    core.info(`Head commit: ${head}`)

    // Ensure that the base and head properties are set on the payload.
    if (!(base && head)) {
      core.setFailed(
        `The base and head commits are missing from the payload for this ${github.context.eventName} event. Please submit an issue on this action's GitHub repo.`
      )

      // To satisfy TypeScript, even though this is unreachable.
      base = ''
      head = ''
    }

    // Use GitHub's compare two commits API.
    // https://developer.github.com/v3/repos/commits/#compare-two-commits
    const response = await octokit.rest.repos.compareCommits({
      base,
      head,
      owner: github.context.repo.owner,
      repo: github.context.repo.repo
    })

    // Ensure that the request was successful.
    if (response.status !== 200) {
      core.setFailed(
        `The GitHub API for comparing the base and head commits for this ${github.context.eventName} event returned ${response.status}, expected 200. Please submit an issue on this action's GitHub repo.`
      )
    }

    // Ensure that the head commit is ahead of the base commit.
    if (response.data.status !== 'ahead') {
      core.setFailed(
        `The head commit for this ${github.context.eventName} event is not ahead of the base commit. Please submit an issue on this action's GitHub repo.`
      )
    }

    // Get the changed files from the response payload.
    const files = response.data.files ?? []
    const all = [] as string[]
    const added = [] as string[]
    const modified = [] as string[]
    const removed = [] as string[]
    const renamed = [] as string[]
    const addedModified = [] as string[]

    for (const file of files) {
      const filename = file.filename

      // eslint-disable-next-line no-console
      console.log(file)

      // const result = await octokit.rest.repos.getContent({
      //   owner: github.context.repo.owner,
      //   repo: github.context.repo.repo,
      //   path: filename
      // })

      all.push(filename)

      switch (file.status as FileStatus) {
        case 'added':
          added.push(filename)
          addedModified.push(filename)
          break
        case 'modified':
          modified.push(filename)
          addedModified.push(filename)
          break
        case 'removed':
          removed.push(filename)
          break
        case 'renamed':
          renamed.push(filename)
          break
        default:
          core.setFailed(
            `One of your files includes an unsupported file status '${file.status}', expected 'added', 'modified', 'removed', or 'renamed'.`
          )
      }

      const allFormatted = all.join(' ')
      const addedFormatted = added.join(' ')
      const modifiedFormatted = modified.join(' ')
      const removedFormatted = removed.join(' ')
      const renamedFormatted = renamed.join(' ')
      const addedModifiedFormatted = addedModified.join(' ')

      // Log the output values.
      core.info(`All: ${allFormatted}`)
      core.info(`Added: ${addedFormatted}`)
      core.info(`Modified: ${modifiedFormatted}`)
      core.info(`Removed: ${removedFormatted}`)
      core.info(`Renamed: ${renamedFormatted}`)
      core.info(`Added or modified: ${addedModifiedFormatted}`)

      // Set step output context.
      core.setOutput('all', allFormatted)
      core.setOutput('added', addedFormatted)
      core.setOutput('modified', modifiedFormatted)
      core.setOutput('removed', removedFormatted)
      core.setOutput('renamed', renamedFormatted)
      core.setOutput('added_modified', addedModifiedFormatted)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
    // eslint-disable-next-line no-console
    else console.error(error)
  }
}

run()
