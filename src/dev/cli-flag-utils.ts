export function readFlag(args: string[], flag: string) {
  const index = args.findIndex((value) => value === flag);
  if (index >= 0) {
    return args[index + 1];
  }

  const inline = args.find((value) => value.startsWith(`${flag}=`));
  if (!inline) {
    return undefined;
  }

  return inline.slice(flag.length + 1);
}

export function hasFlag(args: string[], flag: string) {
  return args.includes(flag) || args.some((value) => value.startsWith(`${flag}=`));
}

export function readBooleanFlag(args: string[], flag: string) {
  if (args.includes(flag)) {
    return "true";
  }

  const inline = args.find((value) => value.startsWith(`${flag}=`));
  if (!inline) {
    return undefined;
  }

  return inline.slice(flag.length + 1);
}

export function stripFlag(args: string[], flag: string, takesValue = true) {
  const strippedArgs: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];

    if (current === flag) {
      if (takesValue) {
        index += 1;
      }
      continue;
    }

    if (current.startsWith(`${flag}=`)) {
      continue;
    }

    strippedArgs.push(current);
  }

  return strippedArgs;
}
