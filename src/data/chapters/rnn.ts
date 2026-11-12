import type { Chapter } from "./types";
export const rnn: Chapter = {
  moduleId: "rnn",
  objectives: [
    "Unroll recurrence and trace hidden states.",
    "Explain vanishing and exploding gradients.",
    "Build a sequence baseline with leakage-safe evaluation.",
  ],
  prerequisites: [
    "Neural networks",
    "Chain rule",
    "Sequence ordering and padding",
  ],
  sections: [
    {
      id: "foundations",
      title: "Foundations / learning from ordered data",
      paragraphs: [
        "A sequence is not just a set: changing order can change meaning. An RNN summarizes a prefix in a hidden state, then updates that state using the next input. Unlike a fixed-size flattened input, this recurrence naturally accepts different sequence lengths. The same transition parameters are reused at every step.",
        "Tasks differ in how they use the states. A sequence classifier may read the final valid state; a tagger predicts at every step; an autoregressive model predicts the next element from the prefix. Define exactly what is known at prediction time before choosing the architecture. Future inputs must not leak into a supposedly causal prediction.",
        "Hidden state is a learned summary, not a lossless record of the sequence. A finite-dimensional state must compress information, and training determines what is retained. Long-range dependencies can be difficult even when the recurrence can theoretically represent them.",
      ],
    },
    {
      id: "architecture",
      title: "Unrolling the recurrent computation",
      paragraphs: [
        "At time t, the simple tanh RNN computes hₜ = tanh(Wxh xₜ + Whh hₜ₋₁ + b). The hidden state is often initialized to zeros for each independent sequence. A separate output head maps a state to a target. Unrolling draws a copy of this operation for every time step, but the copies share parameters.",
        "Stacked RNNs use the lower layer’s sequence of states as the upper layer’s input. Bidirectional RNNs process forward and backward, combining both contexts. They are useful when the full sequence is available, but cannot be used unchanged for real-time causal prediction.",
        "Padding makes batches rectangular, yet padded positions should not contribute to losses or final-state selection. For variable lengths, use sequence packing or explicitly gather the last valid state. Taking the last padded state can turn padding length into an unintended feature.",
      ],
      equation:
        "h₀ = 0\nhₜ = tanh(Wxh xₜ + Whh hₜ₋₁ + b)\nŷₜ = output_head(hₜ)\nRecurrent parameters = h·d + h·h + h (single shared bias)",
    },
    {
      id: "mathematics",
      title: "Backpropagation through time",
      paragraphs: [
        "The recurrent matrix influences every state, so its gradient accumulates contributions across time. The derivative connecting distant states contains a product of Jacobians. If these products repeatedly shrink, early information receives a vanishing gradient; if they expand, gradients can explode. This is a property of both the recurrent weights and activation derivatives.",
        "For tanh, the local derivative is 1 − h², bounded above by one and close to zero in saturation. Repeated multiplication can suppress influence across many steps. Gradient clipping rescales a gradient whose norm exceeds a threshold. It helps control exploding updates but does not recover a gradient that has vanished.",
        "Truncated backpropagation through time limits the number of steps through which gradients flow. A carried hidden state can still contain older information, but learning credit assignment does not reach arbitrarily far back. Detach carried states between truncation windows to avoid retaining the entire previous computation graph.",
      ],
      equation:
        "∂hₜ/∂hₜ₋₁ = diag(1 − hₜ²) Whh\n∂hₜ/∂hₖ = Jₜ Jₜ₋₁ … Jₖ₊₁\nClipping: g ← g · min(1, threshold / ||g||)",
    },
    {
      id: "worked-example",
      title: "Worked example / a scalar recurrence",
      paragraphs: [
        "Let hₜ = tanh(0.5xₜ + 0.8hₜ₋₁), h₀ = 0, and inputs x₁ = 1, x₂ = 0. The first state is tanh(0.5) ≈ 0.4621. The second is tanh(0.8×0.4621) ≈ 0.3537. Even though the second input is zero, the state remains nonzero because it carries information from the first input.",
        "The derivative of h₂ with respect to h₁ is 0.8×(1 − 0.3537²) ≈ 0.6999. The derivative of h₁ with respect to x₁ is 0.5×(1 − 0.4621²) ≈ 0.3932. Multiplying gives ∂h₂/∂x₁ ≈ 0.2752. A change in the first input still affects the second state, but its influence has shrunk.",
        "Over twenty steps, repeated factors around 0.7 would yield about 0.7²⁰ ≈ 0.0008. Actual Jacobians vary and are matrices, but this scalar picture explains why a vanilla recurrence struggles to learn distant dependencies.",
      ],
      exercise: {
        prompt:
          "Why is a zero input not equivalent to resetting the hidden state?",
        solution:
          "The update still includes Whh hₜ₋₁ and the bias. Resetting removes the previous state; zeroing the current input only removes its direct contribution.",
      },
    },
    {
      id: "implementation",
      title: "Implementation / sequence classification",
      paragraphs: [
        "This PyTorch reference assumes a fixed-length batch shaped (B, T, d). RNN returns all time-step outputs plus the final state. With batch_first=True, the first dimension remains the batch. A bidirectional or multilayer model changes the layout of the returned final states, so inspect those shapes explicitly.",
        "Zero gradients for each optimization step, compute a classification loss, backpropagate, clip gradients, and update. For varying sequence lengths, use pack_padded_sequence and the actual lengths rather than blindly selecting the last padded timestep. For forecasting, split chronologically and fit scaling on the training interval only.",
      ],
      language: "Python / PyTorch",
      code: `import torch
from torch import nn

rnn = nn.RNN(input_size=d, hidden_size=32, batch_first=True)
head = nn.Linear(32, classes)
optimizer = torch.optim.Adam(
    list(rnn.parameters()) + list(head.parameters()), lr=1e-3)
optimizer.zero_grad()
outputs, final_state = rnn(X)  # X: (B, T, d), fixed length
logits = head(final_state[-1])
loss = nn.CrossEntropyLoss()(logits, labels)
loss.backward()
torch.nn.utils.clip_grad_norm_(
    list(rnn.parameters()) + list(head.parameters()), 1.0)
optimizer.step()`,
    },
    {
      id: "advanced",
      title: "State management & recurrent alternatives",
      paragraphs: [
        "Stateful streaming carries a state from one chunk to the next. This only makes sense when chunks belong to the same sequence in the correct order. Reset between unrelated examples or users. Otherwise one example contaminates another, and shuffling can break the assumed continuity.",
        "Orthogonal recurrent initialization can help preserve norms initially. Gated architectures such as GRUs and LSTMs introduce controlled paths for memory, often making longer dependencies easier to learn. They add parameters and still process time sequentially.",
        "Teacher forcing supplies the true previous token during training. At inference, a generative model consumes its own outputs, which may drift from training conditions. This exposure mismatch is separate from gradient instability. Evaluate rollouts at the horizon needed by the actual task, rather than only one-step predictions.",
      ],
    },
    {
      id: "limitations",
      title: "Failure modes & temporal evaluation",
      paragraphs: [
        "Sequential computation limits training parallelism across time. Long sequences also increase memory for backpropagation. A high-performing one-step predictor can accumulate large errors when rolled out repeatedly. Compare against last-value, moving-average, or other simple sequence baselines.",
        "Overlapping time windows can leak near-identical subsequences across a random split. Split the source timeline first, then construct windows inside each partition; consider a gap when labels or features overlap future intervals. Account for delays in when targets become observable.",
        "An RNN’s state cannot simply be interpreted as a human-readable memory. Probe performance with controlled sequence lengths and distractors. If the task needs long global context, attention or other sequence models may be a better fit, but compare resource use and causal constraints fairly.",
      ],
    },
    {
      id: "assessment",
      title: "Assessment & transfer",
      paragraphs: [
        "Sketch an unrolled three-step RNN with shared parameters. Explain how changing the first input affects the final prediction, and why clipping cannot solve vanishing gradients. Design a leakage-safe split for overlapping hourly forecasting windows.",
      ],
      exercise: {
        prompt:
          "For d=5 and h=8, how many parameters does the stated single-bias recurrence have?",
        solution:
          "8×5 + 8×8 + 8 = 112. PyTorch’s nn.RNN uses two bias vectors by default, so its recurrent layer has 120 parameters for these sizes. Always check the implementation convention.",
      },
    },
  ],
  references: [
    {
      title: "Dive into Deep Learning / Recurrent neural networks",
      url: "https://d2l.ai/chapter_recurrent-neural-networks/index.html",
    },
    {
      title: "On the difficulty of training recurrent neural networks",
      url: "https://arxiv.org/abs/1211.5063",
    },
    {
      title: "PyTorch / RNN",
      url: "https://docs.pytorch.org/docs/stable/generated/torch.nn.RNN.html",
    },
  ],
};
