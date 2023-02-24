import * as core from '@actions/core'
import * as github from '@actions/github'
import {markdownTable} from 'markdown-table'
import validate from './axe'
import {getDOM} from './dom'

async function run(): Promise<void> {
  try {
    // Create GitHub client with the API token.
    const token = core.getInput('GITHUB_TOKEN', {required: true})

    const octokit = github.getOctokit(token)

    // Debug log the payload.
    core.info(`Payload ${JSON.stringify(github.context.payload, undefined, 2)}`)

    // Get event name.
    const eventName = github.context.eventName

    // Define the base and head commits to be extracted from the payload.
    let base = ''
    let head = ''

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
        return
    }

    // Log the base and head commits
    core.info(`Base commit: ${base}`)
    core.info(`Head commit: ${head}`)

    // Ensure that the base and head properties are set on the payload.
    if (!(base && head)) {
      core.setFailed(
        `The base and head commits are missing from the payload for this ${github.context.eventName} event. Please submit an issue on this action's GitHub repo.`
      )
      return
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
      return
    }

    // Ensure that the head commit is ahead of the base commit.
    if (response.data.status !== 'ahead') {
      core.setFailed(
        `The head commit for this ${github.context.eventName} event is not ahead of the base commit. Please submit an issue on this action's GitHub repo.`
      )
      return
    }

    // Get the changed files from the response payload.
    // Process only the tpl files
    const files = (response.data.files ?? []).filter(f =>
      f.filename.endsWith('.tpl')
    )

    if (files.length < 1) {
      core.info('Nothing to validate')
      return
    }

    let output: string[] = ['# Accessibility validation']

    for (const file of files) {
      const filename = file.filename
      core.info(`Processing template ${filename}`)

      const result = await octokit.rest.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: filename,
        ref: base
      })

      // TODO: figure out ts def
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const contents = Buffer.from(result.data.content, 'base64').toString()

      // build dom
      const dom = await getDOM(contents)

      // validate
      const validationResults = await validate(dom.document.body)

      if (validationResults.violations.length < 1) {
        output = [...output, '\n> No violations found.\n\n']
      }

      output = [...output, `## Violation(s) for: ${filename}  `]

      const violations = validationResults.violations.map(v => {
        return [
          v.impact,
          v.description,
          v.help,
          v.helpUrl,
          v.nodes.map(n => n.element?.outerHTML).join(',')
        ]
      })

      const table = markdownTable([
        ['Impact', 'Description', 'Help', 'Help URL', 'Elements'],
        ...violations
      ])

      output = [...output, '\n', table, '\n\n']
    }

    if (output.length < 1) {
      core.info('No files to process')
      return
    }

    const text = output.join('\n\n')

    const prNo = github.context.payload.pull_request?.number
    if (eventName === 'pull_request' && prNo) {
      core.info(`Publish PR comment, ${prNo}`)
      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNo,
        body: text
      })
    } else if (eventName === 'push') {
      core.info(`Publish commit comment, ${github.context.sha}`)
      await octokit.rest.repos.createCommitComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        commit_sha: github.context.sha,
        body: text
      })
    }
  } catch (error) {
    if (error instanceof Error)
      core.setFailed(
        `Error thrown: ${error.message}, ${error.stack}, ${error.name}`
      )
    else core.setFailed((error as string).toString())
  }
}

run()
