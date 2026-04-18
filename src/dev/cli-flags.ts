export function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  if (index >= 0) {
    return args[index + 1];
  }

  const prefixedFlag = `${flag}=`;
  const inlineValue = args.find((value) => value.startsWith(prefixedFlag));
  return inlineValue ? inlineValue.slice(prefixedFlag.length) : undefined;
}
