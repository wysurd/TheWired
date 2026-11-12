import type { Chapter } from "./types";
export const lstm: Chapter = {
  moduleId: "lstm",
  objectives: [
    "Trace the cell state and each gate.",
    "Calculate one LSTM update.",
    "Distinguish memory capacity from a guarantee of long-term retention.",
  ],
  prerequisites: ["Vanilla RNNs", "Sigmoid and tanh", "Elementwise operations"],
  sections: [
    {
      id: "foundations",
      title: "Foundations / controlled memory",
      paragraphs: [
        "A vanilla RNN repeatedly transforms its hidden state through a nonlinear map. An LSTM introduces a separate cell state with an additive update and gates that control information flow. This provides a more direct route for information and gradients across time, making some long-range dependencies easier to learn.",
        "The cell state c and hidden state h are distinct. The cell carries internal memory; the hidden state exposes a gated, squashed view to the next layer and the next recurrent step. Gates are learned real-valued vectors in (0,1), not literal binary switches.",
        "Memory is selective because the task loss trains what to keep. An LSTM does not understand time or importance automatically, and it does not retain an unlimited transcript. Its success depends on data, state size, optimization, and the dependency structure.",
      ],
    },
    {
      id: "architecture",
      title: "Four transformations, two states",
      paragraphs: [
        "At each time step, concatenate the current input xₜ with hₜ₋₁. The forget gate f controls retention of the previous cell; the input gate i controls the amount of new candidate information g written; the output gate o controls how much of the transformed cell is exposed as h. The candidate g is usually tanh-valued, so it can add positive or negative content.",
        "All gates have the hidden width h. Their elementwise operations allow different cell coordinates to retain different information. Standard implementations fuse the four affine transformations for efficiency, even though diagrams draw them separately.",
        "A stacked LSTM feeds the hidden sequence of one layer to the next. A bidirectional LSTM uses future and past context, making it appropriate only when the full sequence is available. Forget-gate bias initialization can favor early retention, but it is a design choice rather than a universal requirement.",
      ],
      equation:
        "fₜ = sigmoid(Wf[xₜ; hₜ₋₁] + bf)\niₜ = sigmoid(Wi[xₜ; hₜ₋₁] + bi)\ngₜ = tanh(Wg[xₜ; hₜ₋₁] + bg)\noₜ = sigmoid(Wo[xₜ; hₜ₋₁] + bo)\ncₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ gₜ\nhₜ = oₜ ⊙ tanh(cₜ)",
    },
    {
      id: "mathematics",
      title: "The additive path & gradient flow",
      paragraphs: [
        "Along the direct cell-state path, treating the gates as fixed, ∂cₜ/∂cₜ₋₁ = diag(fₜ). If forget gates stay close to one, this path can preserve derivatives across many steps. This is only one part of the full derivative: gates also depend on the previous hidden state, which depends on the cell.",
        "If f is consistently 0.9, the direct-path contribution after fifty steps is 0.9⁵⁰ ≈ 0.0052. Even gated memory can fade. Gates near saturation can themselves receive small derivatives. The additive path improves the learning geometry; it does not remove all optimization problems.",
        "With input width d and hidden width h, a single-bias LSTM layer has 4h(d+h+1) parameters. Implementations with separate input and recurrent biases have 4h(d+h+2). Training still uses backpropagation through time, and gradient clipping remains useful.",
      ],
      equation:
        "Direct cell path over k steps ≈ ∏ diag(fₜ)\nSingle-bias parameters = 4h(d + h + 1)\nPyTorch default parameters = 4h(d + h + 2)",
    },
    {
      id: "worked-example",
      title: "Worked example / selective retention",
      paragraphs: [
        "Consider one cell coordinate, with previous cell cₜ₋₁ = 2. Suppose the current gates are f = 0.8, i = 0.25, o = 0.6, and candidate g = −0.4. The retained contribution is 0.8×2 = 1.6. The new write is 0.25×(−0.4) = −0.1. Their sum gives cₜ = 1.5.",
        "The exposed hidden value is hₜ = 0.6×tanh(1.5) ≈ 0.5431. The cell value is larger than the hidden value because the hidden view is squashed and gated. The cell can preserve information without fully exposing it at that step.",
        "Holding gates fixed, a small change in the previous cell is multiplied by 0.8 along the direct path. A small change in candidate g is multiplied by 0.25. These are separate controls: forgetting old content and writing new content are not one complementary gate in a standard LSTM.",
      ],
      exercise: {
        prompt:
          "If the output gate becomes zero, is the cell necessarily erased?",
        solution:
          "No. hₜ becomes zero, but cₜ is still computed from retention and writing. The output gate controls exposure, not direct deletion of the cell state.",
      },
    },
    {
      id: "implementation",
      title: "Implementation / paired states",
      paragraphs: [
        "PyTorch returns both the hidden and cell states. The reference below assumes fixed-length float input (B, T, d). For variable lengths, use packed sequences so the final states correspond to actual sequence ends. Hidden and cell state each have shape (layers×directions, B, h) in the standard unprojected LSTM.",
        "For streaming chunks from the same sequence, carry both states and detach each between truncated training windows. Reset them between independent sequences. At evaluation, disable dropout with eval() and avoid building a gradient graph. The snippet illustrates the forward path; optimization uses the usual zero_grad, backward, and step sequence.",
      ],
      language: "Python / PyTorch",
      code: `from torch import nn

lstm = nn.LSTM(input_size=d, hidden_size=32,
               num_layers=2, batch_first=True, dropout=0.1)
head = nn.Linear(32, classes)
sequence, (h_n, c_n) = lstm(X)  # fixed-length X: (B, T, d)
logits = head(h_n[-1])
loss = nn.CrossEntropyLoss()(logits, labels)
# For a following chunk of the SAME sequence:
state = (h_n.detach(), c_n.detach())
next_sequence, next_state = lstm(next_chunk, state)`,
    },
    {
      id: "advanced",
      title: "Variants, projections & alternatives",
      paragraphs: [
        "Peephole variants let gates inspect the cell state directly. Coupled-gate variants link input and forget decisions. Projected LSTMs reduce the dimension of exposed hidden states while retaining a larger cell. Each changes parameter counts and shape conventions; do not assume all LSTM equations describe every library option.",
        "GRUs use fewer gates and combine memory and exposed state more tightly. They can be cheaper, but performance is task dependent. Transformers offer parallel training and direct token-to-token access at a different memory cost. Small recurrent models can still be useful for low-latency streaming and compact state.",
        "Long-range benchmarks should vary the gap between relevant events. A model that performs well on short sequences may fail when distractors grow. Curriculum training or better initialization can help, but require evaluation on lengths and patterns not seen during training.",
      ],
    },
    {
      id: "limitations",
      title: "Memory is finite, evaluation is temporal",
      paragraphs: [
        "LSTMs can still forget, overfit, or rely on shortcuts. The recurrent dependency limits parallelism across steps, and retaining activations for long sequences uses substantial memory. More hidden units increase capacity and compute but do not guarantee useful retention.",
        "Temporal leakage is as harmful here as for a vanilla RNN. Feature scaling, imputation, and window construction must respect the prediction cutoff. A bidirectional network may appear dramatically better simply because it sees information that will not exist during deployment.",
        "Compare against a simple recurrence and a nonrecurrent baseline. Inspect performance by sequence length and forecast horizon, not only aggregate error. For generation, test free-running outputs because feeding true history during validation can conceal compounding mistakes.",
      ],
    },
    {
      id: "assessment",
      title: "Assessment & transfer",
      paragraphs: [
        "Write down all six update equations without looking. Explain the distinction between retaining a cell and exposing a hidden state. Design a test in which a model must remember a symbol across a variable number of irrelevant inputs.",
      ],
      exercise: {
        prompt: "Compute parameters for d=10 and h=20 using one bias per gate.",
        solution:
          "4×20×(10+20+1) = 2,480. With two biases per gate as in default PyTorch, the count is 2,560. Neither count includes an external output head.",
      },
    },
  ],
  references: [
    {
      title: "Long Short-Term Memory / Hochreiter & Schmidhuber",
      url: "https://doi.org/10.1162/neco.1997.9.8.1735",
    },
    {
      title: "Dive into Deep Learning / LSTM",
      url: "https://d2l.ai/chapter_recurrent-modern/lstm.html",
    },
    {
      title: "PyTorch / LSTM",
      url: "https://docs.pytorch.org/docs/stable/generated/torch.nn.LSTM.html",
    },
  ],
};
