import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"

const katexSchema = {
    ...defaultSchema,
    tagNames: [
        ...new Set([
            ...(defaultSchema.tagNames || []),
            "span",
            "u",
            "math",
            "annotation",
            "semantics",
            "mrow",
            "mi",
            "mo",
            "mn",
            "msup",
            "mfrac",
            "mover",
            "munder",
            "msqrt",
            "mtable",
            "mtr",
            "mtd",
        ]),
    ],
    attributes: {
        ...defaultSchema.attributes,
        span: [...(defaultSchema.attributes?.span || []), ["className"], ["style"]],
        div: [...(defaultSchema.attributes?.div || []), ["className"], ["style"]],
        math: [...(defaultSchema.attributes?.math || []), ["xmlns"]],
    },
}

export const markdownPlugins = {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex, rehypeRaw, [rehypeSanitize, katexSchema]],
}
