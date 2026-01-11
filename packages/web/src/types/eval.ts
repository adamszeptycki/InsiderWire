// Types for LLM Evaluation Results

export interface EvalScores {
  answerCorrectness: number; // 0-1 decimal
  faithfulness: number; // 0-1 decimal  
  toolsCommand: number; // 0-1 decimal
}

export interface EvalInput {
  question: string;
  context: string;
  expectedAnswer: string;
}

export interface EvalOutput {
  generatedAnswer: string;
  reasoning: string;
  toolsUsed: string[];
}

export interface EvalRun {
  model: string;
  temperature: number;
  maxTokens: number;
  executionTime: number;
  tokensUsed: number;
}


export interface EvalResultsPageProps {
  evalId: string;
}
