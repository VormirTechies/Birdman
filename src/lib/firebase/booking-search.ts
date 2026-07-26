export function bookingSearchPrefixes(values: Array<unknown>, maxLength = 40) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value ?? '').trim().toLowerCase())
        .filter(Boolean)
        .flatMap((value) =>
          Array.from(
            { length: Math.max(0, Math.min(value.length, maxLength) - 1) },
            (_, index) => value.slice(0, index + 2)
          )
        )
    )
  );
}
