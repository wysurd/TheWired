import type { Chapter } from "./types";
export const tree: Chapter = {
  moduleId: "tree",
  objectives: [
    "Choose a split using weighted impurity.",
    "Distinguish classification and regression trees.",
    "Control overfitting and inspect an individual prediction path.",
  ],
  prerequisites: [
    "Mean and variance",
    "Conditional probability",
    "Train/validation/test evaluation",
  ],
  sections: [
    {
      id: "foundations",
      title: "Foundations / recursive partitioning",
      paragraphs: [
        "A decision tree divides the feature space into regions using a sequence of tests. A sample follows one path from the root to a leaf. In a classification tree, a leaf may store class proportions and predict the most frequent class. In a regression tree, a leaf often predicts the mean target of its training samples.",
        "Unlike a dense neural network, a standard axis-aligned tree chooses one feature and a threshold at each internal node. This makes individual paths inspectable. A path is a description of the model’s rule, not necessarily a causal explanation of the world. Correlated features can offer interchangeable splits.",
        "Trees need little feature scaling because threshold order is preserved by monotonic transformations. They still require correct handling of categorical variables, missing values, and time-dependent features. Library support differs; do not assume every tree can consume arbitrary strings or missing values directly.",
      ],
    },
    {
      id: "architecture",
      title: "Nodes, leaves & greedy growth",
      paragraphs: [
        "At a node, training evaluates candidate feature thresholds and chooses one that improves a criterion. The samples are split into children and the procedure repeats. This greedy strategy finds a useful local choice, not a globally optimal tree. A decision made near the root shapes all later partitions.",
        "Stopping rules include maximum depth, minimum samples needed to split, minimum samples per leaf, and minimum impurity decrease. A tree can also be grown and then pruned. The resulting complexity controls both fit and interpretability.",
        "For continuous features, thresholds are usually considered between sorted observed values. Classification leaves estimate probabilities from their local counts. Small leaves can give extreme and poorly calibrated probabilities, even if the hard prediction is correct on training data.",
      ],
      equation:
        "if feature[j] ≤ threshold: go left\nelse: go right\nRepeat until a leaf returns a prediction",
    },
    {
      id: "mathematics",
      title: "Impurity, loss reduction & pruning",
      paragraphs: [
        "Gini impurity is 1 − Σk pk², where pk is the class proportion in a node. It is zero for a pure node and larger when classes are mixed. Entropy, −Σk pk log pk, is another criterion. For a split, compare the parent impurity with the sample-weighted impurity of its children, not an unweighted average.",
        "For squared-error regression, the mean minimizes the sum of squared deviations within a leaf. Splitting is useful when it reduces the combined residual sum of squares. A constant leaf cannot represent a trend within its region, so additional partitions approximate nonlinear functions in steps.",
        "Cost-complexity pruning balances fit against the number of leaves: Rα(T) = R(T) + α|leaves(T)|. The appropriate α is selected using validation or cross-validation. The training criterion alone always favors enough capacity to fit noise when arbitrary growth is allowed.",
      ],
      equation:
        "Gini(node) = 1 − Σk pk²\nGain = I(parent) − (nL/n)I(left) − (nR/n)I(right)\nRegression leaf = mean(y in leaf)\nPruning objective = fit_cost + α·leaf_count",
    },
    {
      id: "worked-example",
      title: "Worked example / compare a split",
      paragraphs: [
        "Suppose a node has ten samples: six positive and four negative. Its Gini impurity is 1 − 0.6² − 0.4² = 0.48. A proposed split sends four positives and no negatives left, and two positives plus four negatives right.",
        "The left child is pure, so its impurity is zero. In the right child, proportions are 1/3 and 2/3, giving Gini 1 − 1/9 − 4/9 = 4/9 ≈ 0.4444. The weighted child impurity is (4/10)×0 + (6/10)×(4/9) ≈ 0.2667. The gain is 0.48 − 0.2667 ≈ 0.2133.",
        "The tree compares this gain against other valid candidate splits. A large immediate gain can still lead to a brittle model, especially with few samples. Minimum leaf sizes and held-out validation help prevent tiny, misleading rules.",
      ],
      exercise: {
        prompt:
          "Why would averaging the two child impurities without weights be wrong here?",
        solution:
          "The children have different sizes. An unweighted average would treat four samples as equally influential as six, giving 0.2222 instead of the correct 0.2667.",
      },
    },
    {
      id: "implementation",
      title: "Implementation / a leakage-safe pipeline",
      paragraphs: [
        "This scikit-learn reference assumes numeric features, potentially with missing values. The imputer is fit inside the pipeline so each training fold learns its own medians. Trees do not need standardization here. A stratified split helps preserve class proportions, but use group or temporal splitting if samples are related or ordered.",
        "Choose depth, leaf size, and pruning strength on validation data. Evaluate once on the untouched test set after choices are fixed. The example prints balanced accuracy to avoid letting the majority class dominate a single aggregate accuracy figure. Inspect per-class errors as well.",
      ],
      language: "Python / scikit-learn",
      code: `from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.metrics import balanced_accuracy_score

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=7)
model = make_pipeline(
    SimpleImputer(strategy="median"),
    DecisionTreeClassifier(max_depth=4, min_samples_leaf=10,
                           random_state=7))
model.fit(X_train, y_train)
print(balanced_accuracy_score(y_test, model.predict(X_test)))
print(export_text(model[-1]))`,
    },
    {
      id: "advanced",
      title: "Categoricals, missingness & interpretability",
      paragraphs: [
        "One-hot encoding lets a numeric tree test category membership, but a single split only isolates one encoded category. Ordinal encoding invents an order unless the categories have one. Some tree algorithms support native categorical partitions; their behavior is not interchangeable with a generic numeric tree.",
        "Missingness can itself be informative, but it can also reveal data collection artifacts that disappear at deployment. A pipeline may impute and include a missingness indicator, or use a tree implementation with explicit missing-value routing. Validate against how future inputs will actually arrive.",
        "A short tree can be read globally; a deep tree usually cannot. Feature importance based on impurity decrease can favor features with many possible split points. Held-out permutation importance measures a different quantity and is also affected by correlated features. Neither is a causal effect estimate.",
      ],
    },
    {
      id: "limitations",
      title: "Instability, boundaries & extrapolation",
      paragraphs: [
        "Small changes in data can change an early split, producing a very different tree. This high variance motivates ensembles such as random forests. A shallow tree is more stable and legible but may underfit curved boundaries or feature interactions that require many axis-aligned regions.",
        "Regression trees predict constants within leaves and generally cannot extrapolate beyond their training leaf target means. A new input far outside the observed feature range can still land in a familiar leaf and receive an ordinary-looking prediction. Distance from training data is not automatically surfaced.",
        "Data leakage is often more consequential than hyperparameters. Features measured after the target event, duplicate subjects, or preprocessing fit on all data can create impressive but invalid results. Document when every feature becomes available and evaluate at the real prediction cutoff.",
      ],
    },
    {
      id: "assessment",
      title: "Assessment & transfer",
      paragraphs: [
        "Compute a candidate split with Gini impurity using unequal child sizes. Explain why a greedy algorithm is not a global optimizer. Describe when a depth-four tree might be preferable to a deeper tree despite lower training accuracy.",
      ],
      exercise: {
        prompt:
          "A regression leaf contains targets 2, 4, and 9. What constant minimizes squared error, and what is that error?",
        solution:
          "The mean is 5. The sum of squared errors is (2−5)² + (4−5)² + (9−5)² = 26. The mean squared error is 26/3.",
      },
    },
  ],
  references: [
    {
      title: "scikit-learn / Decision trees",
      url: "https://scikit-learn.org/stable/modules/tree.html",
    },
    {
      title: "An Introduction to Statistical Learning / free textbook",
      url: "https://www.statlearning.com/",
    },
    {
      title: "scikit-learn / Minimal cost-complexity pruning",
      url: "https://scikit-learn.org/stable/auto_examples/tree/plot_cost_complexity_pruning.html",
    },
  ],
};
