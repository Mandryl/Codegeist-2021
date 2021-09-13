export interface PostExecutionRequest {
    texts: string[];
}

export interface PostExecutionResponse {
    executionArn: string;
    startDate: number
}

export interface PostExecutionStatusRequest {
    executionArn: string;
}

export interface KeyPoint {
    keypoint: string;
}

export interface KeyPointAnalysisResult {
    keypoint_matchings: [KeyPoint];
}

export interface PostExecutionStatusResponseOutput {
    statusCode: string;
    body: string;
}

export interface PostExecutionStatusResponse {
    output: PostExecutionStatusResponseOutput;
    status: string;
}
