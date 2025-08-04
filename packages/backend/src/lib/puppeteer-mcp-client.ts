/**
 * Puppeteer MCP Client
 * Wrapper around MCP Puppeteer tools for easier usage
 */

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  selector?: string;
  saveToFile?: boolean;
  outputDir?: string;
  encoded?: boolean;
}

export interface NavigationOptions {
  allowDangerous?: boolean;
  launchOptions?: Record<string, any>;
}

export class PuppeteerMCPClient {
  private isInitialized = false;

  constructor() {
    // MCP tools are available globally, no additional setup needed
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string, options: NavigationOptions = {}): Promise<void> {
    try {
      // Note: This would be called through MCP in actual implementation
      // For now, we simulate the call structure
      const result = await this.callMCPTool('puppeteer_navigate', {
        url,
        allowDangerous: options.allowDangerous || false,
        launchOptions: options.launchOptions || null
      });
      
      this.isInitialized = true;
      console.log(`🌐 Navigated to: ${url}`);
    } catch (error) {
      console.error(`❌ Navigation failed: ${error.message}`);
      throw new Error(`Failed to navigate to ${url}: ${error.message}`);
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(name: string, options: ScreenshotOptions = {}): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer not initialized. Call navigate() first.');
    }

    try {
      const result = await this.callMCPTool('puppeteer_screenshot', {
        name,
        selector: options.selector,
        width: options.width || 1280,
        height: options.height || 720,
        encoded: options.encoded || false,
        saveToFile: options.saveToFile !== false,
        outputDir: options.outputDir || 'screenshots'
      });

      console.log(`📸 Screenshot captured: ${name}`);
      return result.path || `${name}.png`;
    } catch (error) {
      console.error(`❌ Screenshot failed: ${error.message}`);
      throw new Error(`Failed to capture screenshot: ${error.message}`);
    }
  }

  /**
   * Click an element
   */
  async click(selector: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer not initialized. Call navigate() first.');
    }

    try {
      await this.callMCPTool('puppeteer_click', { selector });
      console.log(`👆 Clicked: ${selector}`);
    } catch (error) {
      console.error(`❌ Click failed: ${error.message}`);
      throw new Error(`Failed to click ${selector}: ${error.message}`);
    }
  }

  /**
   * Fill an input field
   */
  async fill(selector: string, value: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer not initialized. Call navigate() first.');
    }

    try {
      await this.callMCPTool('puppeteer_fill', { selector, value });
      console.log(`✏️ Filled: ${selector} = ${value}`);
    } catch (error) {
      console.error(`❌ Fill failed: ${error.message}`);
      throw new Error(`Failed to fill ${selector}: ${error.message}`);
    }
  }

  /**
   * Select from dropdown
   */
  async select(selector: string, value: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer not initialized. Call navigate() first.');
    }

    try {
      await this.callMCPTool('puppeteer_select', { selector, value });
      console.log(`📋 Selected: ${selector} = ${value}`);
    } catch (error) {
      console.error(`❌ Select failed: ${error.message}`);
      throw new Error(`Failed to select ${selector}: ${error.message}`);
    }
  }

  /**
   * Hover over an element
   */
  async hover(selector: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer not initialized. Call navigate() first.');
    }

    try {
      await this.callMCPTool('puppeteer_hover', { selector });
      console.log(`🖱️ Hovered: ${selector}`);
    } catch (error) {
      console.error(`❌ Hover failed: ${error.message}`);
      throw new Error(`Failed to hover ${selector}: ${error.message}`);
    }
  }

  /**
   * Execute JavaScript
   */
  async evaluate(script: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer not initialized. Call navigate() first.');
    }

    try {
      const result = await this.callMCPTool('puppeteer_evaluate', { script });
      console.log(`🔧 Executed script successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Script execution failed: ${error.message}`);
      throw new Error(`Failed to execute script: ${error.message}`);
    }
  }

  /**
   * Close browser and cleanup
   */
  async close(): Promise<void> {
    try {
      await this.callMCPTool('puppeteer_close', {});
      this.isInitialized = false;
      console.log(`🔒 Browser closed`);
    } catch (error) {
      console.error(`❌ Close failed: ${error.message}`);
      // Don't throw, just log the error
    }
  }

  /**
   * Internal method to call MCP tools
   * In actual implementation, this would interface with the MCP protocol
   */
  private async callMCPTool(tool: string, params: Record<string, any>): Promise<any> {
    // Simulate MCP call
    // In real implementation, this would use the MCP protocol to call the tool
    console.log(`🔧 Calling MCP tool: ${tool}`, params);
    
    // Return mock result for now
    return { success: true, result: 'mock' };
  }
}

export default PuppeteerMCPClient;