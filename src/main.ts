import * as core from '@actions/core'
import * as github from '@actions/github'
import {markdownTable} from 'markdown-table'
import type {Result} from 'axe-core'
import validate from './axe'
import {getDOM} from './dom'
import {ALLOWED_FILE_STATUS, MD_THEAD} from './const'
import type {GitRef} from './types'

const run = async (): Promise<void> => {
  try {
    // Create GitHub client with the API token.
    const token = core.getInput('GITHUB_TOKEN', {required: true})

    const octokit = github.getOctokit(token)

    // Debug log the payload.
    core.debug(
      `Payload ${JSON.stringify(github.context.payload, undefined, 2)}`
    )

    // Get event name.
    const eventName = github.context.eventName

    // Define the base and head commits to be extracted from the payload.
    const {base, head} = getGitRef(eventName)

    // Log the base and head commits
    core.debug(`Base commit: ${base}`)
    core.debug(`Head commit: ${head}`)

    // Ensure that the base and head properties are set on the payload.
    if (!(base && head)) {
      core.setFailed(
        `The base and head commits are missing from the payload. This action only supports pull requests and pushes, ${github.context.eventName} events are not supported.`
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
        `The GitHub API for comparing the base and head commits for this ${github.context.eventName} event returned ${response.status}, expected 200.`
      )
      return
    }

    // Ensure that the head commit is ahead of the base commit.
    if (response.data.status !== 'ahead') {
      core.setFailed(
        `The head commit for this ${github.context.eventName} event is not ahead of the base commit.`
      )
      return
    }

    // Get the changed files from the response payload.
    // Process only the tpl files
    const files = (response.data.files ?? []).filter(
      f => ALLOWED_FILE_STATUS.includes(f.status) && f.filename.endsWith('.tpl')
    )

    if (files.length < 1) {
      core.info('Nothing to validate')
      return
    }

    let output: string[] = ['## Accessibility validation']

    for (const file of files) {
      const filename = file.filename
      core.info(`Processing template ${filename}`)

      const result = await octokit.rest.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: filename,
        ref: head
      })

      // TODO: figure out ts def
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const contents = Buffer.from(result.data.content, 'base64').toString()

      // Build dom from TPL
      const dom = await getDOM(contents)

      // Scan full html if enclosed with html tag otherwise scan the body
      const rootEle = contents.includes('</html>')
        ? dom.document.documentElement
        : dom.document.body

      // Invoke axe-core validation
      const validationResults = await validate(rootEle)

      if (validationResults.violations.length < 1) {
        output = [...output, '\n> No violations found.\n\n']
      }

      output = [...output, `### [${filename}](${file.blob_url})`]

      const table = getMDTableFromViolations(validationResults.violations)

      output = [...output, '\n', table, '\n\n']
    }

    const text = output.join('\n\n')

    const prNo = github.context.payload.pull_request?.number
    if (eventName === 'pull_request' && prNo) {
      // Add a comment to the PR
      core.debug(`Publish PR comment, ${prNo}`)
      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: prNo,
        body: text
      })
    } else if (eventName === 'push') {
      // Otherwise Add a comment to the commit
      core.debug(`Publish commit comment, ${github.context.sha}`)
      await octokit.rest.repos.createCommitComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        commit_sha: github.context.sha,
        body: text
      })
    } else {
      core.setFailed(`The comment action is failed for ${eventName}`)
    }
  } catch (error) {
    if (error instanceof Error)
      core.setFailed(
        `Error thrown: ${error.message}, ${error.stack}, ${error.name}`
      )
    else core.setFailed(`Custom Error thrown: ${(error as string).toString()}`)
  }
}

const getMDTableFromViolations = (violations: Result[]): string => {
  const violationsArr = violations.map(v => {
    return [
      v.impact,
      v.description,
      v.help,
      v.helpUrl,
      v.nodes.map(n => n.target.join(', ')).join(', '),
      v.nodes.map(n => `\`${n.html}\``).join(', ')
    ]
  })

  return markdownTable([[...MD_THEAD], ...violationsArr])
}

const getGitRef = (eventName: string): GitRef => {
  // Define the base and head commits to be extracted from the payload.
  switch (eventName) {
    case 'pull_request':
      return {
        base: github.context.payload.pull_request?.base?.sha,
        head: github.context.payload.pull_request?.head?.sha
      }
    case 'push':
      return {
        base: github.context.payload.before,
        head: github.context.payload.after
      }
  }

  return {}
}

run()
