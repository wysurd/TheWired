import type { Chapter } from "./types";
export const gnn: Chapter = {
  moduleId: "gnn",
  objectives: [
    "Define permutation-equivariant message passing.",
    "Compute one normalized graph update.",
    "Identify graph leakage, oversmoothing, and expressiveness limits.",
  ],
  prerequisites: [
    "Matrix multiplication",
    "Neural networks",
    "Nodes, edges, and adjacency matrices",
  ],
  sections: [
    {
      id: "foundations",
      title: "Foundations / structure as input",
      paragraphs: [
        "A graph represents entities as nodes and relationships as edges. Node features might describe atoms, edge features chemical bonds, and a graph-level target a molecular property. Other tasks predict a node label or whether an edge exists. These tasks have different information boundaries and evaluation protocols.",
        "There is no intrinsic first node in most graphs. Renumbering nodes should renumber node outputs consistently, while a graph-level output should stay unchanged. These are permutation equivariance and invariance respectively. A model that treats arbitrary node IDs as meaningful may learn the indexing scheme rather than the underlying structure.",
        "A GNN repeatedly combines information from neighbors. Unlike a CNN’s fixed pixel grid, neighborhoods can have different sizes and connectivity. The graph itself is an assumption: a poor or leaking construction can invalidate results before any model is trained.",
      ],
    },
    {
      id: "architecture",
      title: "Messages, aggregation & readout",
      paragraphs: [
        "A message-passing layer computes messages from neighboring node states and optional edge features, aggregates them, then updates the receiving state. Sum, mean, and max are common permutation-invariant aggregators. The node update should preserve the distinction between a node’s own state and information received from its neighborhood.",
        "After k layers, a node can generally depend on nodes within k hops, subject to the exact architecture. A graph-level readout pools node representations, often by sum or mean. Mean pooling loses graph-size information unless it is supplied separately; sum pooling can distinguish counts but changes scale with graph size.",
        "Graph attention assigns learned weights to neighbor messages. Sampling neighborhoods can make large graphs tractable, but introduces estimator and coverage tradeoffs. Edge direction, multiple relation types, and self-loops all affect which information can flow.",
      ],
      equation:
        "mᵥ = AGGREGATE({ message(hᵥ, hᵤ, eᵤᵥ) : u ∈ N(v) })\nhᵥ′ = UPDATE(hᵥ, mᵥ)\ngraph_embedding = READOUT({hᵥ : v ∈ V})",
    },
    {
      id: "mathematics",
      title: "The normalized graph convolution",
      paragraphs: [
        "For an undirected graph, one common GCN layer adds self-loops: Ã = A + I. Define D̃ as the diagonal matrix of degrees in Ã. The propagation matrix S = D̃⁻¹ᐟ² Ã D̃⁻¹ᐟ² scales each edge by the degrees of both endpoint nodes. A layer computes H′ = φ(SHW), where rows of H are node features.",
        "The symmetric normalization helps control scale, but it is not simply an unweighted neighbor mean. A random-walk normalization D̃⁻¹Ã would form row-normalized averages. Both are useful constructions; their coefficients differ on irregular graphs. Adding self-loops ensures a node’s current state contributes to its update.",
        "If P is a permutation matrix, the renamed graph uses PAPᵀ and PH. Propagation produces PH′ under consistent renaming because the same transformation and aggregation are used everywhere. This property is architectural, not something that has to be learned from permutations.",
      ],
      equation: "Ã = A + I\nD̃ᵥᵥ = Σᵤ Ãᵥᵤ\nH′ = ReLU(D̃⁻¹ᐟ² Ã D̃⁻¹ᐟ² H W)",
    },
    {
      id: "worked-example",
      title: "Worked example / a three-node chain",
      paragraphs: [
        "Take an undirected chain 1—2—3, add self-loops, and use scalar features H = (1, 2, 3)ᵀ. The new degrees are (2, 3, 2). Set W = 1 and use the identity activation so the aggregation is easy to inspect.",
        "Node 1 receives its own feature with coefficient 1/2 and node 2’s with coefficient 1/√6. Its output is 1/2 + 2/√6 ≈ 1.3165. Node 2 receives 1/√6 from node 1, 2/3 from itself, and 3/√6 from node 3, totaling about 2.2997. Node 3 receives 2/√6 + 3/2 ≈ 2.3165.",
        "The unequal outputs reflect topology and features, with shared parameters. Repeating such propagation blends neighboring states. Without enough distinguishing information, many repetitions can make nodes increasingly alike.",
      ],
      exercise: {
        prompt: "Would row-normalized averaging give the same node-1 output?",
        solution:
          "No. Row normalization gives (1+2)/2 = 1.5. Symmetric normalization gives 1.3165 here because the endpoints have different degrees.",
      },
    },
    {
      id: "implementation",
      title: "Implementation / dense reference GCN",
      paragraphs: [
        "This educational PyTorch implementation assumes an undirected, unweighted, simple adjacency matrix A with a zero diagonal, and a node feature matrix X. It uses dense matrices for clarity. Production graph libraries use sparse formats because dense adjacency requires quadratic storage in the number of nodes.",
        "For node classification, apply the loss only on labeled training nodes. Decide whether validation/test node features and edges are legitimately visible: transductive evaluation allows a fixed graph with some hidden labels, whereas inductive evaluation tests unseen nodes or graphs. Never feed held-out labels into message passing.",
      ],
      language: "Python / PyTorch",
      code: `import torch
from torch import nn

# A: (N, N), symmetric, zero diagonal; X: (N, d)
A_hat = A + torch.eye(A.shape[0], device=A.device)
degree = A_hat.sum(dim=1)
inv_sqrt = degree.rsqrt()
S = inv_sqrt[:, None] * A_hat * inv_sqrt[None, :]
layer1 = nn.Linear(X.shape[1], 32, bias=False)
layer2 = nn.Linear(32, classes, bias=False)
H = torch.relu(S @ layer1(X))
logits = S @ layer2(H)
loss = nn.CrossEntropyLoss()(logits[train_mask], labels[train_mask])`,
    },
    {
      id: "advanced",
      title: "Expressiveness & long-range information",
      paragraphs: [
        "Many standard message-passing GNNs cannot distinguish certain nonisomorphic graphs, with expressiveness related to the one-dimensional Weisfeiler–Lehman refinement procedure. More layers are not a universal solution. Structural encodings, richer subgraph methods, or higher-order models can help at additional cost.",
        "Oversmoothing occurs when repeated propagation makes node representations too similar. Oversquashing is different: information from a rapidly growing neighborhood must compress into a fixed-width state through graph bottlenecks. Residual connections, normalization, rewiring, or positional features can address some cases, but should be tested against the specific failure.",
        "Heterogeneous graphs have multiple node or relation types. Relation-specific transformations can preserve these meanings. Temporal graphs add a further constraint: every edge and feature used for a prediction must exist before its prediction time.",
      ],
    },
    {
      id: "limitations",
      title: "Graph construction & evaluation traps",
      paragraphs: [
        "For link prediction, held-out target edges must not remain in the message-passing graph. Negative sampling must reflect the real candidate distribution; easy random negatives can inflate performance. Split reciprocal or duplicate edges consistently to avoid seeing the same relationship twice.",
        "Homophily, the tendency of connected nodes to share labels, helps some neighbor-averaging models. On heterophilous graphs, mixing neighbors can blur useful differences. Isolated nodes, noisy edges, and degree imbalance can also change model behavior dramatically.",
        "Report the graph construction procedure, visible information, split protocol, sampling strategy, and variance over seeds. Compare feature-only and structure-only baselines. A strong feature-only baseline can reveal when the graph contributes little or merely introduces leakage.",
      ],
    },
    {
      id: "assessment",
      title: "Assessment & transfer",
      paragraphs: [
        "Derive why sum aggregation is invariant to neighbor order. Explain the difference between a node-level equivariant output and a graph-level invariant output. Design a link-prediction split that removes held-out edges from the message graph.",
      ],
      exercise: {
        prompt:
          "After two ordinary message-passing layers, can node 1 in a long chain directly incorporate a node four hops away?",
        solution:
          "Not through standard local messages alone. Two layers reach at most two hops. Global readouts, extra long-range edges, or other architectural mechanisms would change that boundary.",
      },
    },
  ],
  references: [
    {
      title: "Semi-Supervised Classification with Graph Convolutional Networks",
      url: "https://arxiv.org/abs/1609.02907",
    },
    {
      title: "Neural Message Passing for Quantum Chemistry",
      url: "https://arxiv.org/abs/1704.01212",
    },
    {
      title: "How Powerful are Graph Neural Networks?",
      url: "https://arxiv.org/abs/1810.00826",
    },
  ],
};
