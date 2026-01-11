// Service for processing HTML and converting to markdown

import type { RawPageData } from './contentExtractor';

export interface ProcessedContent {
  url: string;
  title: string;
  markdown: string;
}

/**
 * Cleans HTML using Cheerio and converts to markdown
 * @param rawData Raw page data from content extractor
 * @returns Processed content with clean markdown
 */
export async function processHtmlToMarkdown(rawData: RawPageData): Promise<ProcessedContent> {
  // Use Cheerio to parse and clean HTML
  const { load } = await import('cheerio');
  const $ = load(rawData.html);
  
  // Remove unwanted elements
  removeUnwantedElements($);
  
  // Select main content using priority strategy
  const cleanedHtml = selectMainContent($);
  
  // Validate content
  validateContent(cleanedHtml);
  
  // Convert to markdown
  const markdown = await convertToMarkdown(cleanedHtml);
  
  return {
    url: rawData.url,
    title: rawData.title,
    markdown
  };
}

/**
 * Removes scripts, styles, and other unwanted elements
 */
function removeUnwantedElements($: any): void {
  // Remove script, style, and other unwanted tags
  $('script, style, noscript, link[rel="stylesheet"], meta, head script').remove();
  
  // Remove common unwanted elements for cleaner content
  $('nav, footer, aside, .nav, .navigation, .footer, .sidebar, .ads, .advertisement').remove();
  $('[class*="cookie"], [class*="popup"], [class*="modal"], [class*="overlay"]').remove();
  $('iframe, embed, object, video, audio').remove();
}

/**
 * Selects main content using priority strategy: main → [role="main"] → article → body
 */
function selectMainContent($: any): string {
  // Apply same selection strategy: main, role=main, article, or body
  let contentElement = $('main').first();
  
  if (contentElement.length === 0) {
    contentElement = $('[role="main"]').first();
  }
  
  if (contentElement.length === 0) {
    contentElement = $('article').first();
  }
  
  if (contentElement.length === 0) {
    // If no specific content area found, try to get the body but clean it more
    contentElement = $('body').first();
    // Remove header and footer from body if they exist
    contentElement.find('header, footer, nav').remove();
  }
  
  return contentElement.html() || '';
}

/**
 * Validates that we have meaningful content
 */
function validateContent(html: string): void {
  if (!html.trim() || html.length < 50) {
    throw new Error('No meaningful content found on this page');
  }
}

/**
 * Converts HTML to markdown using Turndown
 */
async function convertToMarkdown(html: string): Promise<string> {
  const TurndownService = (await import('turndown')).default;
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
  });

  const markdown = turndownService.turndown(html);
  
  // Validate markdown output
  if (!markdown.trim() || markdown.length < 10) {
    throw new Error('Failed to convert content to markdown');
  }
  
  return markdown;
} 