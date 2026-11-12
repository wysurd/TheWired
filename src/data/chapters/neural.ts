import type { Chapter } from "./types";
export const neural: Chapter = {
  moduleId: "neural",
  objectives: [
    "Derive a forward pass and a gradient update.",
    "Connect nonlinear activations to expressiveness.",
    "Implement and evaluate a small classifier without data leakage.",
  ],
  prerequisites: [
    "Vectors and matrix multiplication",
    "Derivatives and the chain rule",
    "Basic probability",
  ],
  sections: [
    {
      id: "foundations",
      title: "Foundations & the learning problem",
      paragraphs: [
        "Supervised learning starts with pairs (x, y): an input and a target. A neural network is a parameterized function fθ(x), not a database of rules. We choose parameters θ to minimize an empirical loss on training examples, hoping the learned function generalizes to new samples from the same task. Training loss measures fit to observations; held-out loss estimates performance on unseen observations. These are different quantities.",
        "A neuron computes z = w·x + b and then a = φ(z). The weights determine the influence of each input, the bias shifts the threshold, and the activation φ introduces nonlinearity. Without nonlinear activations, composing any number of affine layers still yields one affine map. Depth alone cannot turn a linear model into a nonlinear one.",
        "For binary classification, the final logit is often passed through a sigmoid to obtain a number between zero and one. This is a model probability, not a guarantee of calibrated confidence. For regression, an unconstrained scalar output is often more appropriate. Choose the output and loss together, based on what the target represents.",
      ],
      bullets: [
        "Separate training, validation, and test data before fitting preprocessing.",
        "Use validation data for architecture choices; reserve test data for final evaluation.",
        "Start with a simple baseline so the network has something meaningful to beat.",
      ],
    },
    {
      id: "architecture",
      title: "Layers, activations & representations",
      paragraphs: [
        "In a dense layer, every output unit receives every input feature. For a batch X of B samples and d features, X has shape B×d, the weight matrix W has shape d×h, and the bias has h entries. The output is φ(XW + b), with the bias broadcast across the batch. Every layer changes the representation available to the next one.",
        "ReLU, max(0, z), is inexpensive and has derivative one for positive inputs, but zero for negative inputs. Units that remain negative can stop receiving useful gradients. Smooth activations such as GELU are common alternatives. Sigmoid and tanh saturate at large magnitudes, which can suppress gradients in deep networks.",
        "A two-layer classifier with widths d→h→c has dh + h + hc + c trainable parameters, including biases. Batch size changes memory and gradient estimates, but does not change this parameter count. The Simulation Lab shows dense topology; it does not represent every architecture in this archive.",
      ],
      equation:
        "H = ReLU(XW₁ + b₁)\nlogits = HW₂ + b₂\nparameters = d·h + h + h·c + c",
    },
    {
      id: "mathematics",
      title: "Loss, backpropagation & optimization",
      paragraphs: [
        "For binary cross-entropy, L = −[y log p + (1−y) log(1−p)]. In practice, use a numerically stable loss that consumes logits rather than manually taking the logarithm of a rounded probability. For a sigmoid logit z, differentiating the combined sigmoid and cross-entropy gives ∂L/∂z = p−y. This elegant cancellation is one reason the pair works well.",
        "Backpropagation applies the chain rule in reverse through the computation graph. At each node, an upstream derivative is multiplied by the local derivative. It computes gradients; the optimizer uses them. Gradient descent updates θ ← θ − η∇θL, where η is the learning rate. Too large a rate can diverge; too small a rate can make learning painfully slow.",
        "For a batch-averaged loss, gradients must also reflect the averaging. Stochastic gradient descent uses a minibatch approximation to the full-data gradient. Adam maintains moving estimates of first and second moments; it changes the update rule, not the definition of the loss. Automatic differentiation tracks operations, but it does not protect you from a wrong target shape or a leaking evaluation split.",
      ],
      equation:
        "z = w·x + b, p = sigmoid(z)\n∂L/∂z = p − y\n∂L/∂w = (p − y)x\n∂L/∂b = p − y",
    },
    {
      id: "worked-example",
      title: "Worked example / one gradient step",
      paragraphs: [
        "Take a single logistic neuron with x = (1, 2), w = (0.1, −0.2), b = 0, and target y = 1. Its logit is 0.1×1 − 0.2×2 = −0.3. The sigmoid output is approximately 0.4256. The positive-class loss is −log(0.4256) ≈ 0.8544. The prediction is below 0.5, so the current decision is incorrect at that threshold.",
        "The derivative with respect to the logit is 0.4256 − 1 = −0.5744. Therefore ∂L/∂w = (−0.5744, −1.1488), and ∂L/∂b = −0.5744. With learning rate 0.1, the new weights are approximately (0.15744, −0.08512) and the new bias is 0.05744.",
        "On the same example, the new logit is about 0.04464 and the probability rises to 0.5112. Its loss drops to about 0.6711. This demonstrates descent on one observation; it does not demonstrate improved generalization. A full network applies the same chain-rule principle through hidden layers.",
      ],
      exercise: {
        prompt:
          "At p = 0.8 and y = 0, what is ∂L/∂z? Which direction should a descent step move the logit?",
        solution:
          "The derivative is 0.8. Gradient descent subtracts a positive quantity, lowering the logit and the predicted probability for the incorrect positive class.",
      },
    },
    {
      id: "implementation",
      title: "Implementation / a reproducible baseline",
      paragraphs: [
        "This PyTorch example is a reference implementation to run in your own Python environment; the website does not execute Python. X_train and X_val must already be float tensors with shape (N, d), and y must be float with shape (N, 1). Fit normalization on training data only, then apply the same transform to validation data.",
        "Use train() during optimization and eval() with no_grad() during evaluation. This matters for dropout and normalization layers even if this small model does not include them. Track both losses over time. In a real project, minibatch the data, repeat several seeds, and compare a logistic regression baseline.",
      ],
      language: "Python / PyTorch",
      code: `import torch
from torch import nn

torch.manual_seed(7)
model = nn.Sequential(nn.Linear(X_train.shape[1], 16),
                      nn.ReLU(), nn.Linear(16, 1))
loss_fn = nn.BCEWithLogitsLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
for epoch in range(100):
    model.train()
    optimizer.zero_grad()
    loss = loss_fn(model(X_train), y_train)
    loss.backward()
    optimizer.step()
model.eval()
with torch.no_grad():
    val_loss = loss_fn(model(X_val), y_val).item()
    probabilities = model(X_val).sigmoid()`,
    },
    {
      id: "advanced",
      title: "Initialization, regularization & depth",
      paragraphs: [
        "Initialization controls signal scale. Giving all units identical weights can preserve symmetry, causing them to learn the same feature. Random initialization breaks this symmetry. He-style initialization accounts for the variance loss introduced by ReLU; Xavier initialization balances input and output scales for other settings. These are useful defaults, not proofs of stable training.",
        "Weight decay discourages large parameters; dropout randomly removes activations during training; early stopping selects an earlier checkpoint using validation performance. These mechanisms constrain learning in different ways. Tune their strength on validation data, not by repeatedly inspecting the test set.",
        "Residual connections add an identity path, often written x + F(x), which helps gradients traverse deep models. Normalization can stabilize intermediate scales. More capacity can reduce training error while worsening generalization, but modern overparameterized models also show regimes that simple bias–variance stories do not fully capture. Always ground conclusions in controlled evaluation.",
      ],
    },
    {
      id: "limitations",
      title: "Failure modes & evaluation",
      paragraphs: [
        "A network can exploit correlations that fail under distribution shift. A classifier trained on one hospital, time period, or sensor may fail elsewhere. Random splits can hide this if related observations land in both training and validation. Use group-aware or temporal splits when the deployment setting calls for them.",
        "Accuracy is inadequate for many imbalanced tasks. Inspect precision, recall, threshold tradeoffs, calibration, and subgroup errors. For regression, inspect residuals and compare errors across the target range. A confidence score is not a measure of whether the input is familiar.",
        "If training fails, first check data types, target encoding, gradients, and a tiny-batch overfit test. If training succeeds but validation degrades, investigate leakage, capacity, regularization, and dataset mismatch. Architecture changes should follow diagnosis rather than replace it.",
      ],
    },
    {
      id: "assessment",
      title: "Assessment & transfer",
      paragraphs: [
        "Explain the difference between computing a gradient and applying an optimizer update. Then derive the parameter count of a 10→8→3 dense network, including biases. Finally, describe a validation strategy for a dataset containing multiple records per person.",
      ],
      exercise: {
        prompt:
          "What is the parameter count, and how should person-level records be split?",
        solution:
          "10×8 + 8 + 8×3 + 3 = 115 parameters. Keep all records from a person in the same split to reduce identity leakage. If deployment is future-facing, also consider a time-based evaluation.",
      },
    },
  ],
  references: [
    {
      title: "Deep Learning, chapter 6 / Goodfellow, Bengio & Courville",
      url: "https://www.deeplearningbook.org/contents/mlp.html",
    },
    {
      title: "PyTorch / BCEWithLogitsLoss",
      url: "https://docs.pytorch.org/docs/stable/generated/torch.nn.BCEWithLogitsLoss.html",
    },
  ],
};
