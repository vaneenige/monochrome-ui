import { env } from "node:process";

type Stream = { isTTY?: boolean };

type Style = "bold" | "cyan" | "dim" | "green" | "red" | "yellow";

type Paint = Record<Style, (text: string) => string>;

const codes: Record<Style, [open: number, close: number]> = {
  bold: [1, 22],
  cyan: [36, 39],
  dim: [2, 22],
  green: [32, 39],
  red: [31, 39],
  yellow: [33, 39],
};

const colorful = (stream: Stream) => {
  if ("NO_COLOR" in env) return false;
  if (env.FORCE_COLOR && env.FORCE_COLOR !== "0") return true;
  return stream.isTTY === true && env.TERM !== "dumb";
};

const paint = (stream: Stream): Paint => {
  const on = colorful(stream);
  const wrap =
    ([open, close]: [number, number]) =>
    (text: string) =>
      on ? `\u001b[${open}m${text}\u001b[${close}m` : text;
  return {
    bold: wrap(codes.bold),
    cyan: wrap(codes.cyan),
    dim: wrap(codes.dim),
    green: wrap(codes.green),
    red: wrap(codes.red),
    yellow: wrap(codes.yellow),
  };
};

export const out = paint(process.stdout);
export const err = paint(process.stderr);

/** `--json`: stdout carries one JSON document, the result or the
 *  error. */
let json = false;

export const useJson = () => {
  json = true;
};

/** Results, on stdout: what a caller pipes or reads. */
export const print = (text = "") => {
  if (!json) process.stdout.write(`${text}\n`);
};

/** Progress and guidance, on stderr. */
export const note = (text = "") => {
  if (!json) process.stderr.write(`${text}\n`);
};

/** The result of a command run with `--json`, on stdout. */
export const emit = (result: Record<string, unknown>) => {
  if (json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

/** A problem the user can fix, printed without a stack. Exit code 1 for
 *  the project's state (not installed, a version mismatch), 2 for usage
 *  (an unknown component or flag). */
export class Problem extends Error {
  hint: string | undefined;
  code: 1 | 2;

  constructor(message: string, hint?: string, code: 1 | 2 = 1) {
    super(message);
    this.hint = hint;
    this.code = code;
  }
}

export const fail = (message: string, hint?: string, code: 1 | 2 = 1) => {
  if (json)
    process.stdout.write(`${JSON.stringify({ error: message, hint: hint ?? null }, null, 2)}\n`);
  note(`${err.red("error")} ${message}`);
  if (hint) note(err.dim(hint));
  process.exitCode = code;
};

export const pad = (text: string, width: number) =>
  text.length >= width ? `${text} ` : text + " ".repeat(width - text.length);
