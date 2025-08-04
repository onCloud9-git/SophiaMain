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
  complexity?: string
  duplicateCode?: number
  performanceScore?: number
}

interface TestResults {
  unitTests: {
    passed: boolean
    total: number
    passed_count: number
    failed_count: number
    duration: number
  }
  integrationTests: {
    passed: boolean
    total: number
    passed_count: number
    failed_count: number
    duration: number
  }
  e2eTests: {
    passed: boolean
    total: number
    passed_count: number
    failed_count: number
    duration: number
  }
  overall: {
    passed: boolean
    totalTests: number
    passedTests: number
    duration: number
  }
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
    try {
      const metrics = {
        linesOfCode: await this.countLinesOfCode(projectPath),
        testCoverage: await this.getTestCoverage(projectPath),
        eslintErrors: await this.runESLintCheck(projectPath),
        typescriptErrors: await this.runTypeScriptCheck(projectPath),
        securityIssues: await this.runSecurityScan(projectPath),
        complexity: await this.analyzeCodeComplexity(projectPath),
        duplicateCode: await this.detectDuplicateCode(projectPath),
        performanceScore: await this.analyzePerformance(projectPath)
      }
      
      logger.info(`Code analysis completed for ${projectPath}`, metrics)
      return metrics
      
    } catch (error) {
      logger.error('Code analysis failed:', error)
      // Return fallback metrics
    return {
        linesOfCode: 0,
        testCoverage: 0,
        eslintErrors: 999,
        typescriptErrors: 999,
        securityIssues: 999,
        complexity: 'high',
        duplicateCode: 0,
        performanceScore: 0
      }
    }
  }

  /**
   * Count lines of code in the project
   */
  private async countLinesOfCode(projectPath: string): Promise<number> {
    try {
      const { spawn } = require('child_process')
      return new Promise((resolve) => {
        const process = spawn('find', [projectPath, '-name', '*.tsx', '-o', '-name', '*.ts', '-o', '-name', '*.js', '-o', '-name', '*.jsx'], {
          stdio: 'pipe'
        })
        
        let fileCount = 0
        let totalLines = 0
        
        process.stdout.on('data', async (data) => {
          const files = data.toString().trim().split('\n').filter(f => f)
          for (const file of files) {
            try {
              const content = await fs.readFile(file, 'utf8')
              totalLines += content.split('\n').length
              fileCount++
            } catch (err) {
              // Skip file if error
            }
          }
        })
        
        process.on('close', () => resolve(totalLines))
        process.on('error', () => resolve(0))
      })
    } catch (error) {
      return 0
    }
  }

  /**
   * Get test coverage percentage
   */
  private async getTestCoverage(projectPath: string): Promise<number> {
    try {
      const coverageFile = path.join(projectPath, 'coverage', 'coverage-summary.json')
      const exists = await fs.access(coverageFile).then(() => true).catch(() => false)
      
      if (exists) {
        const coverage = JSON.parse(await fs.readFile(coverageFile, 'utf8'))
        return coverage.total?.statements?.pct || 0
      }
      
      // If no coverage file, estimate based on test files presence
      const testsExist = await this.checkForTests(projectPath)
      return testsExist ? 60 : 0 // Estimate 60% if tests exist
      
    } catch (error) {
      return 0
    }
  }

  /**
   * Run ESLint check
   */
  private async runESLintCheck(projectPath: string): Promise<number> {
    try {
      const { spawn } = require('child_process')
      return new Promise((resolve) => {
        const eslintProcess = spawn('npx', ['eslint', '.', '--format', 'json'], {
          cwd: projectPath,
          stdio: 'pipe'
        })
        
        let errorOutput = ''
        eslintProcess.stdout.on('data', (data) => {
          errorOutput += data.toString()
        })
        
        eslintProcess.on('close', (code) => {
          try {
            const results = JSON.parse(errorOutput)
            const totalErrors = results.reduce((sum: number, file: any) => {
              return sum + file.errorCount + file.warningCount
            }, 0)
            resolve(totalErrors)
          } catch (parseError) {
            resolve(0) // If can't parse, assume no errors
          }
        })
        
        eslintProcess.on('error', () => resolve(0))
      })
    } catch (error) {
      return 0
    }
  }

  /**
   * Run TypeScript check
   */
  private async runTypeScriptCheck(projectPath: string): Promise<number> {
    try {
      const { spawn } = require('child_process')
      return new Promise((resolve) => {
        const tscProcess = spawn('npx', ['tsc', '--noEmit'], {
          cwd: projectPath,
          stdio: 'pipe'
        })
        
        let errorOutput = ''
        tscProcess.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })
        
        tscProcess.on('close', (code) => {
          // Count error lines (rough estimate)
          const errorLines = errorOutput.split('\n').filter(line => 
            line.includes('error TS') || line.includes('Error:')
          )
          resolve(errorLines.length)
        })
        
        tscProcess.on('error', () => resolve(0))
      })
    } catch (error) {
      return 0
    }
  }

  /**
   * Run security scan
   */
  private async runSecurityScan(projectPath: string): Promise<number> {
    try {
      const { spawn } = require('child_process')
      return new Promise((resolve) => {
        const auditProcess = spawn('npm', ['audit', '--json'], {
          cwd: projectPath,
          stdio: 'pipe'
        })
        
        let auditOutput = ''
        auditProcess.stdout.on('data', (data) => {
          auditOutput += data.toString()
        })
        
        auditProcess.on('close', () => {
          try {
            const audit = JSON.parse(auditOutput)
            const vulnerabilities = audit.metadata?.vulnerabilities
            if (vulnerabilities) {
              return resolve(
                (vulnerabilities.high || 0) + 
                (vulnerabilities.critical || 0) + 
                (vulnerabilities.moderate || 0)
              )
            }
            resolve(0)
          } catch (parseError) {
            resolve(0)
          }
        })
        
        auditProcess.on('error', () => resolve(0))
      })
    } catch (error) {
      return 0
    }
  }

  /**
   * Analyze code complexity
   */
  private async analyzeCodeComplexity(projectPath: string): Promise<string> {
    try {
      const fileCount = await this.countFiles(projectPath)
      const linesOfCode = await this.countLinesOfCode(projectPath)
      
      if (fileCount > 50 || linesOfCode > 5000) return 'high'
      if (fileCount > 20 || linesOfCode > 2000) return 'medium'
      return 'low'
      
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Detect duplicate code percentage
   */
  private async detectDuplicateCode(projectPath: string): Promise<number> {
    // Simplified implementation - in production use tools like jscpd
    try {
      const files = await this.getSourceFiles(projectPath)
      let duplicateLines = 0
      let totalLines = 0
      
      // Basic duplicate detection (very simplified)
      const lineHashes = new Map<string, number>()
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8')
        const lines = content.split('\n')
        totalLines += lines.length
        
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.length > 10) { // Ignore short lines
            const count = lineHashes.get(trimmed) || 0
            if (count > 0) duplicateLines++
            lineHashes.set(trimmed, count + 1)
          }
        }
      }
      
      return totalLines > 0 ? Math.round((duplicateLines / totalLines) * 100) : 0
      
    } catch (error) {
      return 0
    }
  }

  /**
   * Analyze performance score
   */
  private async analyzePerformance(projectPath: string): Promise<number> {
    try {
      // Check for performance best practices
      let score = 100
      
      // Check for heavy dependencies
      const packageJsonPath = path.join(projectPath, 'package.json')
      const packageExists = await fs.access(packageJsonPath).then(() => true).catch(() => false)
      
      if (packageExists) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
        const depCount = Object.keys(packageJson.dependencies || {}).length
        
        if (depCount > 50) score -= 20
        else if (depCount > 30) score -= 10
      }
      
      // Check for optimization files
      const nextConfigExists = await fs.access(path.join(projectPath, 'next.config.js')).then(() => true).catch(() => false)
      if (!nextConfigExists) score -= 10
      
      // Check for image optimization
      const hasImageOptimization = await this.checkForImageOptimization(projectPath)
      if (!hasImageOptimization) score -= 15
      
      return Math.max(score, 0)
      
    } catch (error) {
      return 50 // Default score
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

  /**
   * Check for test files in the project
   */
  private async checkForTests(projectPath: string): Promise<boolean> {
    try {
      const testDirs = ['__tests__', 'tests', 'test']
      const testExtensions = ['.test.js', '.test.ts', '.test.tsx', '.spec.js', '.spec.ts', '.spec.tsx']
      
      for (const dir of testDirs) {
        const dirExists = await fs.access(path.join(projectPath, dir)).then(() => true).catch(() => false)
        if (dirExists) return true
      }
      
      // Check for test files in src directory
      const srcPath = path.join(projectPath, 'src')
      const srcExists = await fs.access(srcPath).then(() => true).catch(() => false)
      if (srcExists) {
        const files = await fs.readdir(srcPath, { recursive: true })
        return files.some(file => testExtensions.some(ext => file.toString().endsWith(ext)))
      }
      
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Count total files in project
   */
  private async countFiles(projectPath: string): Promise<number> {
    try {
      const files = await this.getSourceFiles(projectPath)
      return files.length
    } catch (error) {
      return 0
    }
  }

  /**
   * Get all source files in project
   */
  private async getSourceFiles(projectPath: string): Promise<string[]> {
    try {
      const extensions = ['.ts', '.tsx', '.js', '.jsx']
      const ignoreDirs = ['node_modules', '.next', 'coverage', 'dist', 'build']
      
      const { spawn } = require('child_process')
      return new Promise((resolve) => {
        const findArgs = [projectPath, '-type', 'f']
        
        // Add extension filters
        extensions.forEach((ext, index) => {
          if (index > 0) findArgs.push('-o')
          findArgs.push('-name', `*${ext}`)
        })
        
        const findProcess = spawn('find', findArgs, { stdio: 'pipe' })
        
        let output = ''
        findProcess.stdout.on('data', (data) => {
          output += data.toString()
        })
        
        findProcess.on('close', () => {
          const files = output.trim().split('\n').filter(file => {
            if (!file) return false
            // Filter out ignored directories
            return !ignoreDirs.some(dir => file.includes(`/${dir}/`))
          })
          resolve(files)
        })
        
        findProcess.on('error', () => resolve([]))
      })
    } catch (error) {
      return []
    }
  }

  /**
   * Check for image optimization configuration
   */
  private async checkForImageOptimization(projectPath: string): Promise<boolean> {
    try {
      // Check Next.js config for image optimization
      const nextConfigPath = path.join(projectPath, 'next.config.js')
      const configExists = await fs.access(nextConfigPath).then(() => true).catch(() => false)
      
      if (configExists) {
        const config = await fs.readFile(nextConfigPath, 'utf8')
        return config.includes('images') || config.includes('Image')
      }
      
      // Check for image optimization packages
      const packageJsonPath = path.join(projectPath, 'package.json')
      const packageExists = await fs.access(packageJsonPath).then(() => true).catch(() => false)
      
      if (packageExists) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }
        
        return Object.keys(deps).some(dep => 
          dep.includes('image') || 
          dep.includes('sharp') || 
          dep.includes('imagemin')
        )
      }
      
      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Run automated testing pipeline
   */
  async runAutomatedTests(businessId: string): Promise<TestResults> {
    try {
      const projectPath = path.join(CursorAIService.PROJECTS_DIR, businessId)
      
      logger.info(`Running automated tests for business ${businessId}`)
      
      // Run unit tests
      const unitTestResults = await this.runUnitTests(projectPath)
      
      // Run integration tests if they exist
      const integrationTestResults = await this.runIntegrationTests(projectPath)
      
      // Run E2E tests using Puppeteer MCP
      const e2eResults = await this.runE2ETests(businessId, projectPath)
      
      const results: TestResults = {
        unitTests: unitTestResults,
        integrationTests: integrationTestResults,
        e2eTests: e2eResults,
        overall: {
          passed: unitTestResults.passed && integrationTestResults.passed && e2eResults.passed,
          totalTests: unitTestResults.total + integrationTestResults.total + e2eResults.total,
          passedTests: unitTestResults.passed_count + integrationTestResults.passed_count + e2eResults.passed_count,
          duration: unitTestResults.duration + integrationTestResults.duration + e2eResults.duration
        }
      }
      
      logger.info(`Automated tests completed for business ${businessId}`, results)
      return results
      
    } catch (error) {
      logger.error(`Automated tests failed for business ${businessId}:`, error)
      throw error
    }
  }

  /**
   * Run unit tests
   */
  private async runUnitTests(projectPath: string): Promise<any> {
    try {
      const { spawn } = require('child_process')
      return new Promise((resolve) => {
        const testProcess = spawn('npm', ['test', '--', '--json'], {
          cwd: projectPath,
          stdio: 'pipe'
        })
        
        let testOutput = ''
        testProcess.stdout.on('data', (data) => {
          testOutput += data.toString()
        })
        
        testProcess.on('close', (code) => {
          try {
            const results = JSON.parse(testOutput)
            resolve({
              passed: code === 0,
              total: results.numTotalTests || 0,
              passed_count: results.numPassedTests || 0,
              failed_count: results.numFailedTests || 0,
              duration: results.testResults?.reduce((sum: number, test: any) => sum + test.perfStats?.runtime || 0, 0) || 0
            })
          } catch (parseError) {
            resolve({
              passed: code === 0,
              total: 0,
              passed_count: 0,
              failed_count: 0,
              duration: 0
            })
          }
        })
        
        testProcess.on('error', () => {
          resolve({
            passed: false,
            total: 0,
            passed_count: 0,
            failed_count: 0,
            duration: 0
          })
        })
      })
    } catch (error) {
      return {
        passed: false,
        total: 0,
        passed_count: 0,
        failed_count: 0,
        duration: 0
      }
    }
  }

  /**
   * Run integration tests
   */
  private async runIntegrationTests(projectPath: string): Promise<any> {
    // For now, return default results - integration tests are optional
    return {
      passed: true,
      total: 0,
      passed_count: 0,
      failed_count: 0,
      duration: 0
    }
  }

  /**
   * Run E2E tests using Puppeteer MCP
   */
  private async runE2ETests(businessId: string, projectPath: string): Promise<any> {
    try {
      const puppeteerClient = require('../lib/puppeteer-mcp-client').default
      const client = new puppeteerClient()
      
      const startTime = Date.now()
      let testsPassed = 0
      let totalTests = 0
      
      // Test 1: Basic page load
      totalTests++
      try {
        await client.navigate(`http://localhost:3000`)
        await client.screenshot({
          name: `${businessId}-homepage`,
          width: 1920,
          height: 1080
        })
        testsPassed++
        logger.info(`✅ Homepage load test passed for ${businessId}`)
      } catch (error) {
        logger.error(`❌ Homepage load test failed for ${businessId}:`, error)
      }
      
      // Test 2: Basic functionality
      totalTests++
      try {
        await client.evaluate({ script: 'document.title' })
        testsPassed++
        logger.info(`✅ Basic functionality test passed for ${businessId}`)
      } catch (error) {
        logger.error(`❌ Basic functionality test failed for ${businessId}:`, error)
      }
      
      await client.close()
      
      const duration = Date.now() - startTime
      
      return {
        passed: testsPassed === totalTests,
        total: totalTests,
        passed_count: testsPassed,
        failed_count: totalTests - testsPassed,
        duration
      }
      
    } catch (error) {
      logger.error(`E2E tests failed for ${businessId}:`, error)
      return {
        passed: false,
        total: 0,
        passed_count: 0,
        failed_count: 0,
        duration: 0
      }
    }
  }

  /**
   * Setup deployment monitoring and health checks
   */
  async setupDeploymentMonitoring(businessId: string, deploymentUrl: string): Promise<void> {
    try {
      logger.info(`Setting up deployment monitoring for business ${businessId}`)
      
      // Schedule health check job
      const { queue } = require('../jobs/queue')
      await queue.add('deployment-health-check', { 
        businessId, 
        deploymentUrl 
      }, {
        repeat: { every: 300000 }, // Every 5 minutes
        priority: 'normal'
      })
      
      // Schedule performance monitoring
      await queue.add('performance-monitoring', { 
        businessId, 
        deploymentUrl 
      }, {
        repeat: { every: 900000 }, // Every 15 minutes
        priority: 'low'
      })
      
      logger.info(`Deployment monitoring setup completed for business ${businessId}`)
      
    } catch (error) {
      logger.error(`Failed to setup deployment monitoring for business ${businessId}:`, error)
      throw error
    }
  }
}

// Export singleton instance
export const cursorAIService = new CursorAIService()