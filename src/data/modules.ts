export interface Module {
  id: string;
  title: string;
  category: string;
  minutes: number;
  description: string;
  concept: string;
  example: string;
  limitation: string;
  question: string;
  answers: string[];
  correct: number;
}
export const modules: Module[] = [
  {
    id: "neural",
    title: "Neural networks",
    category: "FOUNDATIONS",
    minutes: 30,
    description: "From a single neuron to systems that learn.",
    concept:
      "A neuron computes a weighted sum of its inputs, adds a bias, and applies a nonlinear activation. Layers compose these simple transformations. Training uses backpropagation to compute loss gradients, then an optimizer updates weights to reduce prediction error.",
    example:
      "A multilayer perceptron can estimate housing prices from area, location, and age. Normalize numeric features and evaluate on held-out homes.",
    limitation:
      "More neurons do not guarantee better predictions. Large models can memorize training data; regularization and validation help detect overfitting.",
    question: "What does backpropagation compute?",
    answers: [
      "The number of layers",
      "Gradients of the loss with respect to parameters",
      "A random set of predictions",
    ],
    correct: 1,
  },
  {
    id: "cnn",
    title: "Convolutional networks",
    category: "PERCEPTION",
    minutes: 30,
    description: "Learning spatial patterns, one filter at a time.",
    concept:
      "Convolutional layers slide shared filters over spatial data. Early filters learn local edges and textures; deeper layers combine these into more abstract features. Stride and pooling reduce spatial resolution.",
    example:
      "An image classifier learns features from pixels. A 3×3 convolution applies the same nine spatial weights at each location, with separate weights for each input channel.",
    limitation:
      "CNNs capture local structure well, but global relationships may require depth or larger receptive fields. Translation equivariance does not mean complete rotation invariance.",
    question: "Why share convolutional weights across an image?",
    answers: [
      "To detect the same pattern in different locations",
      "To remove the need for training",
      "To make every output identical",
    ],
    correct: 0,
  },
  {
    id: "rnn",
    title: "Recurrent networks",
    category: "SEQUENCES",
    minutes: 30,
    description: "Carry information forward through time.",
    concept:
      "An RNN processes a sequence by updating a hidden state from the current input and previous state. Its parameters are shared across time steps. Backpropagation through time trains the recurrence.",
    example:
      "Read temperature measurements in time order and predict the next reading from a hidden state summarizing recent history.",
    limitation:
      "Gradients can vanish or explode across long sequences, making long-range dependencies difficult to learn. Gradient clipping helps with exploding gradients.",
    question: "What passes between time steps in an RNN?",
    answers: [
      "A new independent model",
      "The hidden state",
      "Only the final prediction",
    ],
    correct: 1,
  },
  {
    id: "lstm",
    title: "Long short-term memory",
    category: "SEQUENCES",
    minutes: 30,
    description: "Selective memory for long-range dependencies.",
    concept:
      "An LSTM augments recurrence with a cell state and input, forget, and output gates. Gates regulate which information is written, retained, and exposed, providing a more direct path for gradients through time.",
    example:
      "In a sentence, the cell can retain subject information across intervening words to help predict an agreeing verb.",
    limitation:
      "LSTMs improve long-term learning but do not have unlimited memory. Sequential computation can make them slower to train than parallel architectures.",
    question: "What is the role of the forget gate?",
    answers: [
      "Delete the training set",
      "Control how much cell state is retained",
      "Choose the optimizer",
    ],
    correct: 1,
  },
  {
    id: "gnn",
    title: "Graph neural networks",
    category: "STRUCTURE",
    minutes: 30,
    description: "Reason over relationships, not just records.",
    concept:
      "GNNs update node representations by aggregating messages from neighbors. Repeated message-passing layers bring information from progressively farther away. Permutation-invariant aggregation makes node ordering irrelevant.",
    example:
      "Represent a molecule as atoms and bonds, then aggregate neighboring atom features to predict a molecular property.",
    limitation:
      "Many layers can make node representations too similar, a problem called oversmoothing. Graph construction and train/test leakage also require care.",
    question: "What does a message-passing layer aggregate?",
    answers: [
      "Neighbor information",
      "Only node IDs",
      "All training labels directly",
    ],
    correct: 0,
  },
  {
    id: "transformer",
    title: "Transformers",
    category: "ATTENTION",
    minutes: 30,
    description: "Context is a relationship. Attention learns it.",
    concept:
      "Self-attention forms queries, keys, and values from tokens. Scaled query-key dot products become attention weights through softmax; weighted values produce contextual representations. Multiple heads learn different relationships. Position information supplies sequence order.",
    example:
      "In translation, attention lets a token incorporate relevant distant words. A causal mask prevents a language model from attending to future tokens during next-token training.",
    limitation:
      "Standard dense attention uses quadratic memory and computation in sequence length. Attention weights alone are not a complete explanation of model behavior.",
    question: "Why use a causal attention mask?",
    answers: [
      "To ignore every previous token",
      "To prevent access to future tokens",
      "To remove positional information",
    ],
    correct: 1,
  },
  {
    id: "tree",
    title: "Decision trees",
    category: "CLASSICAL ML",
    minutes: 30,
    description: "Interpretable decisions through recursive splits.",
    concept:
      "A decision tree partitions the feature space using successive tests. At each node, training chooses a split that reduces impurity or prediction error. Leaf nodes return a class or numeric estimate.",
    example:
      "A small tree can route a support ticket by urgency and topic. Its decision path can be inspected directly.",
    limitation:
      "Deep trees readily overfit and can change drastically with small data changes. Limit depth or prune using validation data.",
    question: "What helps control decision-tree overfitting?",
    answers: [
      "Always growing deeper",
      "Limiting tree depth",
      "Removing the validation set",
    ],
    correct: 1,
  },
  {
    id: "forest",
    title: "Random forests",
    category: "CLASSICAL ML",
    minutes: 30,
    description: "Many imperfect trees. One stronger prediction.",
    concept:
      "A random forest trains many trees on bootstrap samples and considers random feature subsets at splits. Averaging predictions or voting reduces variance when the trees are not perfectly correlated.",
    example:
      "For tabular risk prediction, combine hundreds of trees. Out-of-bag observations provide a useful internal estimate of generalization.",
    limitation:
      "Forests are less transparent than a single tree, can be memory intensive, and usually cannot extrapolate regression targets beyond observed training values.",
    question: "Why add randomness to the trees?",
    answers: [
      "To make their errors less correlated",
      "To avoid using any data",
      "To guarantee perfect accuracy",
    ],
    correct: 0,
  },
];
