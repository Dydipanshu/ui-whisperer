import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, level, scope, details, timestamp } = body as {
      message?: string;
      level?: string;
      scope?: string;
      details?: unknown;
      timestamp?: string;
    };
    const safeTimestamp = timestamp ?? new Date().toISOString();
    const safeLevel = (level ?? "info").toUpperCase();
    const safeScope = scope ?? "unknown";
    const safeMessage = message ?? "no-message";
    const logEntry = `[${safeTimestamp}] [${safeLevel}] [${safeScope}] ${safeMessage} ${details ? JSON.stringify(details) : ""}\n`;

    const logFilePath = path.join('/tmp', 'debug.log');
    
    // Append to file
    fs.appendFileSync(logFilePath, logEntry);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to write log", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
