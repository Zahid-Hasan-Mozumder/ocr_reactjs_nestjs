import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface InsuranceCardData {
  insuranceCompany?: string;
  planName?: string;
  memberId?: string;
  memberName?: string;
  groupNumber?: string;
  payerId?: string;
  rxBin?: string;
  rxPcn?: string;
  rxGroup?: string;
  copays?: {
    primaryCare?: string;
    specialist?: string;
    urgentCare?: string;
    emergencyRoom?: string;
    generic?: string;
    brandName?: string;
  };
  deductible?: string;
  outOfPocketMax?: string;
  effectiveDate?: string;
  network?: string;
  customerServicePhone?: string;
  providerPhone?: string;
  website?: string;
  additionalInfo?: string[];
  rawText?: string;
}

export interface OcrResult {
  front?: InsuranceCardData;
  back?: InsuranceCardData;
  combined?: InsuranceCardData;
  processingNotes?: string;
}

@Injectable()
export class OcrService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new InternalServerErrorException(
        'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env',
      );
    }
    this.openai = new OpenAI({ apiKey });
  }

  private buildPrompt(side: 'front' | 'back' | 'both'): string {
    const base = `You are an expert OCR system specialized in reading USA medical insurance cards.
Analyze the provided insurance card image(s) carefully and extract all visible text and information.

Return a JSON object with these fields (use null for any field not found):
{
  "insuranceCompany": "Name of the insurance company/payer",
  "planName": "Name of the health plan",
  "memberId": "Member ID or Subscriber ID",
  "memberName": "Full name of the member/subscriber",
  "groupNumber": "Group number",
  "payerId": "Payer ID or Electronic Payer ID",
  "rxBin": "Pharmacy BIN number",
  "rxPcn": "Pharmacy PCN number",
  "rxGroup": "Pharmacy Group number",
  "copays": {
    "primaryCare": "PCP copay amount",
    "specialist": "Specialist copay amount",
    "urgentCare": "Urgent care copay amount",
    "emergencyRoom": "ER copay amount",
    "generic": "Generic drug copay",
    "brandName": "Brand name drug copay"
  },
  "deductible": "Annual deductible amount",
  "outOfPocketMax": "Out-of-pocket maximum",
  "effectiveDate": "Coverage effective date",
  "network": "Network name or plan type (HMO/PPO/EPO/etc.)",
  "customerServicePhone": "Member services phone number",
  "providerPhone": "Provider services phone number",
  "website": "Website URL on the card",
  "additionalInfo": ["Any other important text found on the card"],
  "rawText": "Complete raw text extracted from the card"
}

Important rules:
- Extract EXACTLY what is printed on the card, do not guess or fill in
- For the "rawText" field, include ALL text visible on the card
- If a value is not clearly visible, use null
- Do not include the JSON markdown code block, return only the JSON object`;

    if (side === 'front') return `${base}\n\nThis is the FRONT side of the insurance card.`;
    if (side === 'back') return `${base}\n\nThis is the BACK side of the insurance card.`;
    return `${base}\n\nYou have been provided both the FRONT and BACK sides of the insurance card. Extract and combine all information from both sides into a single comprehensive JSON object.`;
  }

  private fileToBase64(buffer: Buffer, mimetype: string): string {
    return `data:${mimetype};base64,${buffer.toString('base64')}`;
  }

  private mergeCardData(front: InsuranceCardData, back: InsuranceCardData): InsuranceCardData {
    const merged: InsuranceCardData = { ...front };

    for (const key of Object.keys(back) as (keyof InsuranceCardData)[]) {
      if (key === 'copays') {
        merged.copays = { ...back.copays, ...front.copays };
      } else if (key === 'additionalInfo') {
        const frontArr = front.additionalInfo || [];
        const backArr = back.additionalInfo || [];
        merged.additionalInfo = [...new Set([...frontArr, ...backArr])];
      } else if (key === 'rawText') {
        merged.rawText = [front.rawText, back.rawText].filter(Boolean).join('\n---\n');
      } else if (!merged[key] && back[key]) {
        (merged as any)[key] = back[key];
      }
    }

    return merged;
  }

  async extractFromImages(
    frontFile?: Express.Multer.File,
    backFile?: Express.Multer.File,
  ): Promise<OcrResult> {
    if (!frontFile && !backFile) {
      throw new BadRequestException('At least one image (front or back) must be provided.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (frontFile && !allowedMimeTypes.includes(frontFile.mimetype)) {
      throw new BadRequestException(`Front image must be JPEG, PNG, WebP, or GIF.`);
    }
    if (backFile && !allowedMimeTypes.includes(backFile.mimetype)) {
      throw new BadRequestException(`Back image must be JPEG, PNG, WebP, or GIF.`);
    }

    try {
      const result: OcrResult = {};

      if (frontFile && backFile) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: this.buildPrompt('both') },
                {
                  type: 'image_url',
                  image_url: {
                    url: this.fileToBase64(frontFile.buffer, frontFile.mimetype),
                    detail: 'high',
                  },
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: this.fileToBase64(backFile.buffer, backFile.mimetype),
                    detail: 'high',
                  },
                },
              ],
            },
          ],
        });

        const content = response.choices[0]?.message?.content || '{}';
        result.combined = this.parseJsonResponse(content);
      } else if (frontFile) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: this.buildPrompt('front') },
                {
                  type: 'image_url',
                  image_url: {
                    url: this.fileToBase64(frontFile.buffer, frontFile.mimetype),
                    detail: 'high',
                  },
                },
              ],
            },
          ],
        });

        const content = response.choices[0]?.message?.content || '{}';
        result.front = this.parseJsonResponse(content);
        result.combined = result.front;
      } else if (backFile) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: this.buildPrompt('back') },
                {
                  type: 'image_url',
                  image_url: {
                    url: this.fileToBase64(backFile.buffer, backFile.mimetype),
                    detail: 'high',
                  },
                },
              ],
            },
          ],
        });

        const content = response.choices[0]?.message?.content || '{}';
        result.back = this.parseJsonResponse(content);
        result.combined = result.back;
      }

      return result;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      if (error?.status === 401) {
        throw new InternalServerErrorException('Invalid OpenAI API key.');
      }
      if (error?.status === 429) {
        throw new InternalServerErrorException('OpenAI rate limit exceeded. Please try again later.');
      }
      throw new InternalServerErrorException(
        `OCR processing failed: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  private parseJsonResponse(content: string): InsuranceCardData {
    try {
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      return JSON.parse(cleaned);
    } catch {
      return { rawText: content, additionalInfo: ['Could not parse structured data'] };
    }
  }
}
