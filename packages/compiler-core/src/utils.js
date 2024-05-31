function advanceBy (context, len) {
  context.source = context.source.slice(len)
}

export { advanceBy }