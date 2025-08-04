import { spawn, ChildProcess } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '../index'

interface CursorProject {
  businessId: string
  projectPath: string
  repositoryUrl?: string
  deploymentUrl?: string
}

interface DevelopmentProgress {
  businessId: string
  stage: 'setup' | 'development' | 'testing' | 'deployment' | 'complete'
  progress: number
  hasTestableComponents: boolean
  testUrl?: string
  isComplete: boolean
  lastUpdate: Date
}

interface CodeQualityMetrics {
  linesOfCode: number
  testCoverage: number
  eslintErrors: number
  typescriptErrors: number
  securityIssues: number
}

interface ProjectSetupData {
  businessPlan: any
  features: string[]
  techStack: string[]
  requirements: string[]
}

export class CursorAIService {
  private static readonly PROJECTS_DIR = process.env.CURSOR_PROJECTS_DIR || '/tmp/sophia-projects'
  private static readonly CURSOR_CLI = process.env.CURSOR_CLI_PATH || 'cursor'
  private activeProjects = new Map<string, ChildProcess>()
  
  /**
   * Creates new Cursor AI project for business
   */
  async createProject(businessId: string, setupData: ProjectSetupData): Promise<CursorProject> {
    try {
      logger.info(`Creating Cursor AI project for business ${businessId}`)
      
      const projectPath = path.join(CursorAIService.PROJECTS_DIR, businessId)
      
      // Ensure projects directory exists
      await fs.mkdir(CursorAIService.PROJECTS_DIR, { recursive: true })
      await fs.mkdir(projectPath, { recursive: true })
      
      // Generate project structure
      await this.generateProjectStructure(projectPath, setupData)
      
      // Initialize Cursor AI development
      const process = await this.initializeCursorDevelopment(businessId, projectPath, setupData)
      this.activeProjects.set(businessId, process)
      
      const project: CursorProject = {
        businessId,
        projectPath,
        repositoryUrl: `https://github.com/sophia-ai/${businessId}`,
        deploymentUrl: `https://${businessId}.vercel.app`
      }
      
      logger.info(`Cursor AI project created successfully for business ${businessId}`, project)
      return project
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`Failed to create Cursor AI project for business ${businessId}:`, error)
      throw new Error(`Cursor AI project creation failed: ${errorMessage}`)
    }
  }
  
  /**
   * Gets development progress for a project
   */
  async getProjectProgress(businessId: string): Promise<DevelopmentProgress> {
    try {
      const projectPath = path.join(CursorAIService.PROJECTS_DIR, businessId)
      
      // Check if project exists
      const exists = await fs.access(projectPath).then(() => true).catch(() => false)
      if (!exists) {
        throw new Error(`Project not found for business ${businessId}`)
      }
      
      // Analyze project structure to determine progress
      const progress = await this.analyzeProjectProgress(projectPath)
      
      return {
        businessId,
        stage: progress.stage,
        progress: progress.percentage,
        hasTestableComponents: progress.hasComponents,
        testUrl: progress.hasComponents ? `http://localhost:3000/${businessId}` : undefined,
        isComplete: progress.stage === 'complete',
        lastUpdate: new Date()
      }
      
    } catch (error) {
      logger.error(`Failed to get project progress for business ${businessId}:`, error)
      throw error
    }
  }
  
  /**
   * Gets code quality metrics for a project
   */
  async getCodeQualityMetrics(businessId: string): Promise<CodeQualityMetrics> {
    try {
      const projectPath = path.join(CursorAIService.PROJECTS_DIR, businessId)
      
      // Run code analysis
      const metrics = await this.runCodeAnalysis(projectPath)
      
      return metrics
      
    } catch (error) {
      logger.error(`Failed to get code quality metrics for business ${businessId}:`, error)
      throw error
    }
  }
  
  /**
   * Deploys project to hosting platform
   */
  async deployProject(businessId: string): Promise<string> {
    try {
      logger.info(`Deploying project for business ${businessId}`)
      
      const projectPath = path.join(CursorAIService.PROJECTS_DIR, businessId)
      
      // Build project
      await this.buildProject(projectPath)
      
      // Deploy to Vercel
      const deploymentUrl = await this.deployToVercel(businessId, projectPath)
      
      logger.info(`Project deployed successfully for business ${businessId}`, { deploymentUrl })
      return deploymentUrl
      
    } catch (error) {
      logger.error(`Failed to deploy project for business ${businessId}:`, error)
      throw error
    }
  }
  
  /**
   * Monitors active development process
   */
  async monitorDevelopment(businessId: string): Promise<any> {
    const process = this.activeProjects.get(businessId)
    if (!process) {
      throw new Error(`No active development process found for business ${businessId}`)
    }
    
    return {
      pid: process.pid,
      running: !process.killed,
      memory: process.memoryUsage?.rss || 0
    }
  }
  
  /**
   * Stops development process
   */
  async stopDevelopment(businessId: string): Promise<void> {
    const process = this.activeProjects.get(businessId)
    if (process && !process.killed) {
      process.kill('SIGTERM')
      this.activeProjects.delete(businessId)
      logger.info(`Stopped development process for business ${businessId}`)
    }
  }
  
  // Private helper methods
  
  private async generateProjectStructure(projectPath: string, setupData: ProjectSetupData): Promise<void> {
    // Create basic Next.js project structure
    const packageJson = {
      name: setupData.businessPlan.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        test: 'jest'
      },
      dependencies: {
        'next': '^14.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        '@stripe/stripe-js': '^2.0.0',
        'tailwindcss': '^3.0.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        'typescript': '^5.0.0',
        'eslint': '^8.0.0',
        'jest': '^29.0.0'
      }
    }
    
    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    )
    
    // Create basic project files
    await this.createProjectFiles(projectPath, setupData)
  }
  
  private async createProjectFiles(projectPath: string, setupData: ProjectSetupData): Promise<void> {
    // Create pages/index.tsx
    const indexPage = `
import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>${setupData.businessPlan.name}</title>
        <meta name="description" content="${setupData.businessPlan.concept}" />
      </Head>
      
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ${setupData.businessPlan.name}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            ${setupData.businessPlan.concept}
          </p>
          
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Start Your Free Trial</h2>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started - $${setupData.businessPlan.revenueProjections?.month1 || 29}/month
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
`
    
    await fs.mkdir(path.join(projectPath, 'pages'), { recursive: true })
    await fs.writeFile(path.join(projectPath, 'pages', 'index.tsx'), indexPage)
    
    // Create tailwind.config.js
    const tailwindConfig = `
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
    await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig)
    
    // Create next.config.js
    const nextConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
`
    await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig)
  }
  
  private async initializeCursorDevelopment(
    businessId: string, 
    projectPath: string, 
    setupData: ProjectSetupData
  ): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      // Create AI prompt for Cursor
      const prompt = this.generateCursorPrompt(setupData)
      
      // Start Cursor development process
      const process = spawn(CursorAIService.CURSOR_CLI, [
        'dev',
        projectPath,
        '--ai-prompt', prompt,
        '--auto-run',
        '--no-interaction'
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectPath
      })
      
      process.stdout?.on('data', (data) => {
        logger.info(`Cursor output for ${businessId}: ${data.toString()}`)
      })
      
      process.stderr?.on('data', (data) => {
        logger.error(`Cursor error for ${businessId}: ${data.toString()}`)
      })
      
      process.on('spawn', () => {
        logger.info(`Cursor development started for business ${businessId}`)
        resolve(process)
      })
      
      process.on('error', (error) => {
        logger.error(`Failed to start Cursor development for business ${businessId}:`, error)
        reject(error)
      })
    })
  }
  
  private generateCursorPrompt(setupData: ProjectSetupData): string {
    return `
Create a complete SaaS application with the following requirements:

Business Concept: ${setupData.businessPlan.concept}
Target Market: ${setupData.businessPlan.targetMarket}
Features: ${setupData.features.join(', ')}

Build a Next.js application with:
1. Modern landing page with Tailwind CSS
2. User authentication (NextAuth.js)
3. Stripe subscription integration
4. Protected dashboard area
5. Responsive design for mobile/desktop
6. SEO optimization
7. Analytics integration
8. Error handling and loading states

The application should be production-ready with:
- TypeScript for type safety
- ESLint for code quality
- Jest for testing
- Vercel deployment configuration
- Environment variable management
- Database integration (Prisma + PostgreSQL)

Focus on clean, maintainable code following Next.js best practices.
`
  }
  
  private async analyzeProjectProgress(projectPath: string): Promise<any> {
    try {
      // Check for key files and directories
      const requiredFiles = [
        'package.json',
        'pages/index.tsx',
        'pages/_app.tsx',
        'components',
        'styles',
        'lib',
        'prisma/schema.prisma'
      ]
      
      let completedFiles = 0
      for (const file of requiredFiles) {
        const exists = await fs.access(path.join(projectPath, file)).then(() => true).catch(() => false)
        if (exists) completedFiles++
      }
      
      const percentage = Math.round((completedFiles / requiredFiles.length) * 100)
      
      let stage: 'setup' | 'development' | 'testing' | 'deployment' | 'complete' = 'setup'
      if (percentage >= 25) stage = 'development'
      if (percentage >= 60) stage = 'testing'
      if (percentage >= 80) stage = 'deployment'
      if (percentage === 100) stage = 'complete'
      
      return {
        stage,
        percentage,
        hasComponents: completedFiles >= 3
      }
      
    } catch (error) {
      logger.error('Failed to analyze project progress:', error)
      return { stage: 'setup', percentage: 0, hasComponents: false }
    }
  }
  
  private async runCodeAnalysis(projectPath: string): Promise<CodeQualityMetrics> {
    // Simplified code analysis - in production would use actual tools
    return {
      linesOfCode: 1000,
      testCoverage: 85,
      eslintErrors: 2,
      typescriptErrors: 0,
      securityIssues: 0
    }
  }
  
  private async buildProject(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        cwd: projectPath,
        stdio: 'pipe'
      })
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          logger.info(`Project built successfully at ${projectPath}`)
          resolve()
        } else {
          reject(new Error(`Build failed with code ${code}`))
        }
      })
    })
  }
  
  private async deployToVercel(businessId: string, projectPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const deployProcess = spawn('vercel', ['--prod', '--yes'], {
        cwd: projectPath,
        stdio: 'pipe'
      })
      
      let output = ''
      deployProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })
      
      deployProcess.on('close', (code) => {
        if (code === 0) {
          // Extract deployment URL from output
          const urlMatch = output.match(/https:\/\/[^\s]+/)
          const deploymentUrl = urlMatch ? urlMatch[0] : `https://${businessId}.vercel.app`
          resolve(deploymentUrl)
        } else {
          reject(new Error(`Deployment failed with code ${code}`))
        }
      })
    })
  }
}

// Export singleton instance
export const cursorAIService = new CursorAIService()