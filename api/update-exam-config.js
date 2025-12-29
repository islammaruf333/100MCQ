import { Octokit } from '@octokit/rest'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

const owner = process.env.GITHUB_OWNER
const repo = process.env.GITHUB_REPO
const branch = process.env.GITHUB_BRANCH || 'main'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { currentType } = req.body

    if (!currentType || !['type1', 'type2'].includes(currentType)) {
      return res.status(400).json({ error: 'Invalid exam type. Must be type1 or type2' })
    }

    // Get current config file
    const configPath = 'exam-config.json'
    
    let currentSha
    try {
      const { data: currentFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: configPath,
        ref: branch
      })
      currentSha = currentFile.sha
      
      // Decode and parse current config
      const currentContent = Buffer.from(currentFile.content, 'base64').toString('utf-8')
      const config = JSON.parse(currentContent)
      
      // Update currentType
      config.currentType = currentType
      
      // Encode updated config
      const updatedContent = Buffer.from(JSON.stringify(config, null, 2)).toString('base64')
      
      // Update file in GitHub
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: configPath,
        message: `Update exam type to ${currentType}`,
        content: updatedContent,
        sha: currentSha,
        branch
      })

      return res.status(200).json({ 
        success: true, 
        message: `Exam type updated to ${currentType}`,
        config 
      })
    } catch (error) {
      if (error.status === 404) {
        return res.status(404).json({ 
          error: 'Configuration file not found. Please ensure exam-config.json exists in the repository.' 
        })
      }
      throw error
    }
  } catch (error) {
    console.error('Error updating exam config:', error)
    return res.status(500).json({ 
      error: 'Failed to update exam configuration',
      details: error.message 
    })
  }
}
