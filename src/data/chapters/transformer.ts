import type { Chapter } from "./types";
export const transformer: Chapter = {
  moduleId: "transformer",
  objectives: [
    "Compute a small scaled dot-product attention example.",
    "Distinguish masks, positional information, and model families.",
    "Implement a causal block and reason about inference cost.",
  ],
  prerequisites: [
    "Matrix multiplication",
    "Softmax and probability",
    "Neural networks and sequence tasks",
  ],
  sections: [
    {
      id: "foundations",
      title: "Foundations / contextual representations",
      paragraphs: [
        "A token’s meaning depends on context. Self-attention lets each position combine information from other positions using weights computed from their representations. Unlike a recurrence, it does not require passing every interaction through the same sequence of intermediate states. During training, many positions can be processed in parallel.",
        "Tokens are model input units, not necessarily whole words. A tokenizer may split a word into subword pieces, bytes, or other units. Embeddings map token IDs into vectors. Attention then produces contextual representations, and subsequent feed-forward layers transform them further.",
        "Attention alone has no built-in notion of order. Positional encodings or position-dependent transformations provide sequence structure. A Transformer is a family of architectures around attention, not a synonym for a chatbot or for any particular training objective.",
      ],
    },
    {
      id: "architecture",
      title: "Queries, keys, values & blocks",
      paragraphs: [
        "Each input vector is projected into a query, key, and value. A query asks what information is useful, a key describes what a position offers, and a value carries the content to combine. These are learned linear projections, not manually assigned semantic labels. Multi-head attention repeats this process in several subspaces.",
        "A standard block combines attention and a position-wise feed-forward network, with residual paths and normalization. Encoder models often attend bidirectionally; causal decoders restrict attention to the prefix. Encoder–decoder models add cross-attention where decoder queries attend to encoder keys and values.",
        "Layer normalization placement and feed-forward activations vary among models. Rotary positional embeddings rotate queries and keys as a function of position. Learned absolute embeddings and sinusoidal encodings are other choices. Do not assume one block diagram represents every modern model.",
      ],
      equation:
        "Q = XWQ, K = XWK, V = XWV\nhead = softmax(QKᵀ / √dk + mask)V\nMultiHead = concat(head₁, …, headₕ) WO",
    },
    {
      id: "mathematics",
      title: "Scaled dot products, softmax & masks",
      paragraphs: [
        "With sequence length n and head width dk, Q and K have shape n×dk, so QKᵀ is n×n. Softmax is applied across keys for each query. Scaling by √dk keeps dot products from growing too large under common initialization assumptions. Stable softmax subtracts the maximum score before exponentiation without changing the result.",
        "A causal mask adds negative infinity to scores for future keys, making their softmax weights zero. Padding masks exclude nonexistent tokens. Mask conventions differ across libraries: a boolean True can mean allowed in one API and blocked in another. Verify the exact interface, especially when mixing attention implementations.",
        "Dense attention forms n² scores per head and requires roughly O(n²dk) arithmetic for the score and value products. Feed-forward and projection costs also matter. Cached decoding avoids recomputing old keys and values, but the cache still grows with context length.",
      ],
      equation:
        "softmax(s)ᵢ = exp(sᵢ − max(s)) / Σⱼ exp(sⱼ − max(s))\ncausal mask[i, j] = 0 if j ≤ i, otherwise −∞\nattention weights: shape (n, n) per head",
    },
    {
      id: "worked-example",
      title: "Worked example / two keys, one query",
      paragraphs: [
        "Let q = (1, 0), k₁ = (1, 0), and k₂ = (0, 1), with dk = 2. The scaled scores are (1/√2, 0) ≈ (0.7071, 0). Softmax gives weights approximately (0.6698, 0.3302), which sum to one.",
        "Take v₁ = (2, 0) and v₂ = (0, 4). The output is 0.6698×(2, 0) + 0.3302×(0, 4) ≈ (1.3396, 1.3208). Both values contribute even though the first score is higher. Attention is a weighted combination rather than a hard lookup.",
        "If this query is at position one in a causal sequence, the second key is a future position. Masking its score makes the weights (1, 0), and the output becomes (2, 0). The mask changes what information is available, not the values stored at each token.",
      ],
      exercise: {
        prompt: "What are the weights if both unmasked scores are identical?",
        solution:
          "They are (0.5, 0.5). Adding the same constant to both scores does not change them because softmax depends on relative score differences.",
      },
    },
    {
      id: "implementation",
      title: "Implementation / one causal block",
      paragraphs: [
        "This PyTorch reference includes a minimal pre-normalization block. X must already contain embeddings plus suitable positional information, with shape (B, T, d). Choose d divisible by the number of heads. MultiheadAttention uses True to block positions in this boolean mask.",
        "For next-token training, align input tokens and targets by a one-token shift, mask padding in the loss, and ensure no target leaks into its input position. A full language model also needs a tokenizer, embedding layer, stacked blocks, and vocabulary projection. This snippet is a block demonstration, not a pretrained language model.",
      ],
      language: "Python / PyTorch",
      code: `import torch
from torch import nn

class CausalBlock(nn.Module):
    def __init__(self, d=128, heads=4):
        super().__init__()
        self.n1, self.n2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.attn = nn.MultiheadAttention(d, heads, batch_first=True)
        self.ff = nn.Sequential(nn.Linear(d, 4*d), nn.GELU(),
                                nn.Linear(4*d, d))
    def forward(self, x):
        t = x.shape[1]
        blocked = torch.triu(torch.ones(t, t, device=x.device,
                                       dtype=torch.bool), diagonal=1)
        z = self.n1(x)
        a, _ = self.attn(z, z, z, attn_mask=blocked, need_weights=False)
        x = x + a
        return x + self.ff(self.n2(x))`,
    },
    {
      id: "advanced",
      title: "KV caches, efficient attention & adaptation",
      paragraphs: [
        "At autoregressive inference, each new token queries previous keys and values. A KV cache retains those projections instead of recomputing the prefix. Grouped-query and multi-query attention share key/value heads to reduce cache memory. Quantization can reduce weight memory, but activations, caches, and runtime buffers still need space.",
        "FlashAttention computes exact dense attention with a memory-efficient tiling strategy; it does not make every token pair disappear. Sparse or linear attention changes the interaction pattern or computation and can change the model’s behavior. Distinguish a more efficient implementation from a different mathematical operator.",
        "Fine-tuning updates a pretrained model for a task; parameter-efficient methods such as LoRA train low-rank updates while freezing much of the base. Retrieval provides relevant external context at inference. The Oracle in this app uses the visible lesson as context without fine-tuning, external inference, or a retrieval server.",
      ],
    },
    {
      id: "limitations",
      title: "Hallucinations, context & evaluation",
      paragraphs: [
        "A language model learns to predict tokens, not to prove that statements are true. It can produce fluent, incorrect mathematics or fabricated references. A small local model is especially limited at multi-step derivations. Compare explanations to the chapter and verify calculations independently; a confident tone is not evidence.",
        "Finite context windows limit what can be supplied. Longer contexts also cost memory and compute. Truncating a conversation can remove definitions required by later questions. The Oracle therefore shows the current context and clips its size rather than pretending it remembers everything.",
        "Benchmark contamination, prompt sensitivity, and sampling settings complicate evaluation. For a downstream task, use held-out examples that reflect real deployment and inspect failures. Attention visualizations can reveal associations, but individual attention weights are not a complete causal explanation of the output.",
      ],
    },
    {
      id: "assessment",
      title: "Assessment & transfer",
      paragraphs: [
        "Compute a three-key attention example and verify each row sums to one. Explain why positional information is needed and how a causal mask prevents target leakage. Describe which memory terms grow when a conversation doubles in length.",
      ],
      exercise: {
        prompt:
          "If n doubles in standard dense attention, what happens to the number of pairwise scores?",
        solution:
          "It grows by a factor of four: (2n)² = 4n² per head. This is distinct from the linear growth of stored keys and values in a fixed-width KV cache.",
      },
    },
  ],
  references: [
    {
      title: "Attention Is All You Need",
      url: "https://arxiv.org/abs/1706.03762",
    },
    {
      title: "The Illustrated Transformer / Jay Alammar",
      url: "https://jalammar.github.io/illustrated-transformer/",
    },
    { title: "FlashAttention", url: "https://arxiv.org/abs/2205.14135" },
    {
      title: "PyTorch / MultiheadAttention",
      url: "https://docs.pytorch.org/docs/stable/generated/torch.nn.MultiheadAttention.html",
    },
  ],
};
