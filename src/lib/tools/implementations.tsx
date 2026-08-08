import type { ComponentType } from "react";

import { AgeCalculatorTool } from "@/components/tools/implementations/age-calculator";
import { AttendanceCalculatorTool } from "@/components/tools/implementations/attendance-calculator";
import { Base64EncoderDecoderTool } from "@/components/tools/implementations/base64-encoder-decoder";
import { CgpaCalculatorTool } from "@/components/tools/implementations/cgpa-calculator";
import { EmiCalculatorTool } from "@/components/tools/implementations/emi-calculator";
import { GpaCalculatorTool } from "@/components/tools/implementations/gpa-calculator";
import { InterestCalculatorTool } from "@/components/tools/implementations/interest-calculator";
import { InvestmentCalculatorTool } from "@/components/tools/implementations/investment-calculator";
import { JsonFormatterTool } from "@/components/tools/implementations/json-formatter";
import { LoanCalculatorTool } from "@/components/tools/implementations/loan-calculator";
import { LoremIpsumGeneratorTool } from "@/components/tools/implementations/lorem-ipsum-generator";
import { MarksPercentageCalculatorTool } from "@/components/tools/implementations/marks-percentage-calculator";
import { PasswordGeneratorTool } from "@/components/tools/implementations/password-generator";
import { QrCodeGeneratorTool } from "@/components/tools/implementations/qr-code-generator";
import { RandomNumberGeneratorTool } from "@/components/tools/implementations/random-number-generator";
import { UnitConverterTool } from "@/components/tools/implementations/unit-converter";
import { UnixTimestampConverterTool } from "@/components/tools/implementations/unix-timestamp-converter";
import { UuidGeneratorTool } from "@/components/tools/implementations/uuid-generator";
import { WordCounterTool } from "@/components/tools/implementations/word-counter";

/**
 * Maps a tool's slug to its actual implementation component. A slug in the
 * registry with no entry here renders the generic "coming soon" fallback
 * instead — see app/tools/[slug]/page.tsx. Adding a new tool is: write the
 * component, add it here, flip its registry status to "available".
 */
export const toolImplementations: Record<string, ComponentType> = {
  "json-formatter": JsonFormatterTool,
  "password-generator": PasswordGeneratorTool,
  "word-counter": WordCounterTool,
  "base64-encoder-decoder": Base64EncoderDecoderTool,
  "uuid-generator": UuidGeneratorTool,
  "lorem-ipsum-generator": LoremIpsumGeneratorTool,
  "unix-timestamp-converter": UnixTimestampConverterTool,
  "qr-code-generator": QrCodeGeneratorTool,
  "random-number-generator": RandomNumberGeneratorTool,
  "age-calculator": AgeCalculatorTool,
  "gpa-calculator": GpaCalculatorTool,
  "cgpa-calculator": CgpaCalculatorTool,
  "attendance-calculator": AttendanceCalculatorTool,
  "marks-percentage-calculator": MarksPercentageCalculatorTool,
  "unit-converter": UnitConverterTool,
  "loan-calculator": LoanCalculatorTool,
  "emi-calculator": EmiCalculatorTool,
  "interest-calculator": InterestCalculatorTool,
  "investment-calculator": InvestmentCalculatorTool,
};
