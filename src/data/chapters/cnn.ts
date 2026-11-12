import type { Chapter } from "./types";
export const cnn: Chapter = {
  moduleId: "cnn",
  objectives: [
    "Compute convolution shapes and parameter counts.",
    "Trace receptive-field growth.",
    "Implement an image classifier and diagnose spatial shortcut learning.",
  ],
  prerequisites: [
    "Dense networks and gradients",
    "Multidimensional arrays",
    "Train/validation splits",
  ],
  sections: [
    {
      id: "foundations",
      title: "Foundations / spatial inductive bias",
      paragraphs: [
        "Images have local structure: neighboring pixels are often related, and the same edge may appear anywhere. A dense layer ignores this arrangement unless it learns it from data. Convolutional networks impose locality and weight sharing, making a filter useful across many spatial positions. This is an inductive bias: a design assumption that can improve sample efficiency when it matches the task.",
        "The operation commonly called convolution in deep-learning libraries is usually cross-correlation: a kernel slides over the input without being flipped. Each output location is a dot product between the kernel and a local patch. Each output channel learns a different set of filters over all input channels.",
        "Moving an input pattern can move the corresponding output response, a property called translation equivariance. Boundary handling and strided operations complicate exact equivariance. Pooling can add some tolerance to position, but a CNN is not automatically invariant to arbitrary translation, rotation, or scale.",
      ],
    },
    {
      id: "architecture",
      title: "Convolution, pooling & receptive fields",
      paragraphs: [
        "A convolutional block often combines convolution, activation, and normalization. Pooling summarizes small regions, while stride greater than one subsamples the feature map. A 1×1 convolution mixes channels at each position without directly combining neighboring positions. Depthwise convolutions process channels separately; pointwise convolutions can then mix them efficiently.",
        "The receptive field of an output is the region of the original image that can influence it. Stacking two 3×3 stride-one convolutions gives a theoretical 5×5 receptive field, with a nonlinear transformation between them. Strides and dilation change how rapidly that field grows. The effective influence can be concentrated in a smaller region than the theoretical field.",
        "A classifier may end with global average pooling, producing one value per channel, then a small linear head. This reduces dependence on image dimensions and avoids a huge flattened dense layer. Detection and segmentation require retaining or reconstructing spatial information rather than collapsing everything into one vector.",
      ],
      equation:
        "r_next = r_current + (kernel − 1)·dilation·jump\njump_next = jump·stride\nStart: receptive field r = 1, jump = 1",
    },
    {
      id: "mathematics",
      title: "Shapes, channels & parameter sharing",
      paragraphs: [
        "For an input height H, symmetric padding P, dilation D, kernel K, and stride S, output height is floor((H + 2P − D(K−1) − 1)/S + 1). Apply the same formula to width. Padding adds border values; it does not add learnable parameters. In a standard convolution, every output channel has a kernel for every input channel.",
        "With Cin input channels, Cout output channels, and a K×K kernel, the parameter count is Cout(CinK² + 1) when using biases. Crucially, this count does not depend on image height or width. Compute cost still scales with output spatial area, so sharing weights does not make high-resolution processing free.",
        "Backpropagation accumulates contributions from every location at which a shared weight was used. The same parameter learns from many patches. This is why the gradient is a sum across spatial positions rather than an independent parameter update at each pixel.",
      ],
      equation:
        "Hout = floor((H + 2P − D(K−1) − 1)/S + 1)\nparameters = Cout·(Cin·K·K + 1)\nApproximate multiply-accumulates = Hout·Wout·Cout·Cin·K²",
    },
    {
      id: "worked-example",
      title: "Worked example / a filter and a shape",
      paragraphs: [
        "Consider a single-channel 3×3 patch with rows (1, 2, 0), (0, 1, 3), and (2, 0, 1). Apply a 2×2 cross-correlation kernel with rows (1, 0), (0, −1), no bias, stride one, and no padding. The top-left output is 1×1 + 2×0 + 0×0 + 1×(−1) = 0. Repeating across the image yields rows (0, −1) and (0, 0).",
        "Now consider a batch of RGB images with shape (B, 3, 32, 32) in PyTorch channel-first layout. A 3×3 convolution with 16 output channels, stride one, and padding one produces (B, 16, 32, 32). It has 16×(3×9 + 1) = 448 parameters. A subsequent 2×2 max pool with stride two gives (B, 16, 16, 16).",
        "The first convolution sees 3×3 patches. After that pool, each output summarizes a theoretical 4×4 input region: r = 3 + (2−1)×1 = 4, with jump two. Another 3×3 convolution increases the receptive field to 4 + 2×2 = 8.",
      ],
      exercise: {
        prompt:
          "How many parameters does a biased 3×3 convolution from 16 to 32 channels have?",
        solution:
          "32×(16×3×3 + 1) = 4,640. Image dimensions affect the number of operations and activations, not this parameter count.",
      },
    },
    {
      id: "implementation",
      title: "Implementation / compact image classifier",
      paragraphs: [
        "The following reference accepts normalized float tensors of shape (B, 3, H, W). H and W must be large enough for the pool. The final layer emits raw logits for ten classes; pair them with CrossEntropyLoss and integer targets in [0, 9]. Do not add a softmax before that loss.",
        "Normalize using training-set statistics and keep augmentations label preserving. A horizontal flip can make sense for natural objects but can change the meaning of a symbol or medical marker. Use an unaugmented validation transform and evaluate on the deployment-relevant distribution.",
      ],
      language: "Python / PyTorch",
      code: `from torch import nn

model = nn.Sequential(
    nn.Conv2d(3, 16, kernel_size=3, padding=1),
    nn.ReLU(),
    nn.MaxPool2d(2),
    nn.Conv2d(16, 32, kernel_size=3, padding=1),
    nn.ReLU(),
    nn.AdaptiveAvgPool2d(1),
    nn.Flatten(),
    nn.Linear(32, 10),
)
# images: float32 (B, 3, H, W)
# labels: int64 (B,), class IDs 0..9
logits = model(images)
loss = nn.CrossEntropyLoss()(logits, labels)
loss.backward()`,
    },
    {
      id: "advanced",
      title: "Residual blocks, dilation & transfer",
      paragraphs: [
        "Residual blocks learn a correction F(x) added to a skip path x. If shapes differ, a projection can align them. This eases optimization of deep networks, but does not eliminate all gradient or generalization problems. Batch normalization estimates statistics during training and uses running statistics during evaluation; forgetting eval mode can distort validation.",
        "Dilated kernels insert gaps between sampled input positions, expanding the receptive field without increasing kernel parameter count. Depthwise-separable convolutions reduce cost by separating spatial filtering from channel mixing. Both tradeoffs should be evaluated against hardware efficiency, not just symbolic operation counts.",
        "Transfer learning starts from pretrained features. Freeze a backbone to test whether its representation is useful, then consider fine-tuning with a smaller learning rate. Match normalization and input conventions to the pretrained model. If the target domain differs greatly, useful features may not transfer.",
      ],
    },
    {
      id: "limitations",
      title: "Shortcuts, robustness & evaluation",
      paragraphs: [
        "A CNN may recognize background, watermarks, or acquisition artifacts rather than the object of interest. High random-split accuracy can coexist with failure on a new camera or site. Separate related images and evaluate across sources when possible. Occlusion tests can suggest what matters, but saliency maps are not proof of a causal explanation.",
        "Small perturbations, unusual poses, or changed lighting can reduce performance. Augmentation helps only for transformations represented reasonably by the training process. Downsampling can destroy small details; padding can introduce boundary artifacts. Precision-sensitive applications need task-specific error analysis.",
        "For imbalanced classification, inspect per-class recall and confusion matrices. For segmentation, pixel accuracy may hide failure on small structures; overlap metrics and boundary-sensitive analysis can be more informative. Always compare model behavior to the cost of each type of error.",
      ],
    },
    {
      id: "assessment",
      title: "Assessment & transfer",
      paragraphs: [
        "Design a classifier for 64×64 grayscale images using two convolutional blocks. State every tensor shape, compute each layer’s parameter count, and explain which augmentations preserve the target. Explain why a shared filter can recognize a pattern in different locations without guaranteeing rotation invariance.",
      ],
      exercise: {
        prompt:
          "For a 64×64 input, K=5, P=2, S=2, D=1, what is the output height?",
        solution:
          "floor((64 + 4 − 4 − 1)/2 + 1) = floor(32.5) = 32. The same calculation applies independently to width.",
      },
    },
  ],
  references: [
    {
      title: "Dive into Deep Learning / Convolutional neural networks",
      url: "https://d2l.ai/chapter_convolutional-neural-networks/index.html",
    },
    {
      title: "PyTorch / Conv2d",
      url: "https://docs.pytorch.org/docs/stable/generated/torch.nn.Conv2d.html",
    },
    {
      title: "Deep Residual Learning for Image Recognition",
      url: "https://arxiv.org/abs/1512.03385",
    },
  ],
};
