import type { Chapter } from "./types";
export const forest: Chapter = {
  moduleId: "forest",
  objectives: [
    "Explain how averaging reduces variance.",
    "Compute a bootstrap and out-of-bag probability.",
    "Evaluate a forest without confusing OOB checks with deployment validation.",
  ],
  prerequisites: [
    "Decision trees",
    "Variance and correlation",
    "Bootstrap sampling",
  ],
  sections: [
    {
      id: "foundations",
      title: "Foundations / many imperfect predictors",
      paragraphs: [
        "A single deep decision tree can change dramatically when the training data changes. Bagging trains trees on bootstrap samples and combines their outputs, reducing variance when their errors are not perfectly correlated. A random forest adds random feature selection at each split, encouraging trees to make different decisions.",
        "Each tree usually sees a bootstrap sample of n draws with replacement from n training observations. Some rows appear repeatedly and others are absent. At a split, a random subset of features is considered; the best split within that subset is chosen. This randomness is deliberate, not a failure to optimize the chosen tree criterion.",
        "For regression, average tree predictions. Classification implementations may average class probabilities and choose the largest, or vote on predicted labels. These conventions can differ, so read the implementation. scikit-learn averages class probabilities.",
      ],
    },
    {
      id: "architecture",
      title: "Bootstrap, feature subsampling & aggregation",
      paragraphs: [
        "Two random mechanisms create diversity: row resampling for each tree and feature subsampling at each node. Feature subsampling stops one dominant feature from appearing at the root of almost every tree. The forest can trade a little individual-tree strength for less correlated errors.",
        "Important hyperparameters include number of trees, maximum features per split, maximum depth, minimum leaf size, and bootstrap behavior. More trees usually stabilize the ensemble estimate but increase training time, model size, and inference cost. They do not automatically cure leakage or biased training data.",
        "Trees can be trained independently, making parallel execution practical. Memory grows with the total number of nodes, not just the number of trees. For a small dataset, constrained depth and leaf size can make a compact forest both fast and competitive.",
      ],
      equation:
        "Regression: f(x) = (1/T) Σₜ treeₜ(x)\nClassification (probability averaging): p(k|x) = (1/T) Σₜ pₜ(k|x)\nPrediction = argmaxₖ p(k|x)",
    },
    {
      id: "mathematics",
      title: "Variance reduction & out-of-bag samples",
      paragraphs: [
        "If each tree prediction has variance σ² and every pair has the same correlation ρ, the average of T predictions has variance σ²[ρ + (1−ρ)/T]. This simplifying assumption illustrates a key limit: as T grows, the independent part vanishes but the correlated part remains. Diversity matters alongside tree strength.",
        "For a particular training row, the probability of not being selected in one bootstrap sample is (1−1/n)ⁿ, approaching e⁻¹ ≈ 0.368. Those absent rows are out-of-bag for that tree. Aggregate predictions only from trees that did not train on a row to estimate its OOB prediction.",
        "OOB estimates are convenient, but they are not a universal substitute for validation. Related subjects, temporal dependence, globally fitted preprocessing, and repeated hyperparameter tuning can make OOB performance optimistic for the real task. A separate deployment-relevant test remains valuable.",
      ],
      equation:
        "Var(mean of T trees) = σ²[ρ + (1−ρ)/T]\nP(row absent from bootstrap) = (1−1/n)ⁿ ≈ 0.368\nExpected distinct fraction ≈ 1 − e⁻¹ ≈ 0.632",
    },
    {
      id: "worked-example",
      title: "Worked example / diversity beats repetition",
      paragraphs: [
        "Suppose individual predictions have variance 1 and pairwise correlation 0.2. Averaging 100 trees gives variance 0.2 + 0.8/100 = 0.208. With perfectly correlated predictions, the variance stays 1 regardless of tree count. Increasing the ensemble is most effective when members bring different errors.",
        "For five training rows, a bootstrap sample might be indices [0, 2, 2, 4, 0]. Rows 1 and 3 are out-of-bag for this tree. Their OOB predictions must use this tree and other trees that excluded them, never trees trained on them. For finite n=5, the absence probability is (4/5)⁵ ≈ 0.3277, not exactly 0.368.",
        "For binary classification, three trees might output positive probabilities 0.9, 0.4, and 0.4. Probability averaging gives 0.5667 and chooses positive at threshold 0.5. Hard voting would choose negative because two trees are below 0.5. This shows why aggregation conventions matter.",
      ],
      exercise: {
        prompt:
          "With σ²=1, ρ=0.5, and T=10, what is the ensemble variance under the stated assumptions?",
        solution:
          "0.5 + 0.5/10 = 0.55. Even infinitely many such trees would approach 0.5, so lowering correlation can matter more than adding trees.",
      },
    },
    {
      id: "implementation",
      title: "Implementation / a tabular baseline",
      paragraphs: [
        "This scikit-learn reference uses numeric features with median imputation fit only on the training partition. Bootstrap sampling enables OOB estimation. The default OOB classifier score is accuracy, so do not directly compare it with a different metric such as balanced accuracy without stating the distinction. The pipeline imputer also sees all training rows before bootstrapping; this OOB score is an internal diagnostic, not a fully held-out evaluation of the preprocessing pipeline.",
        "The forest uses one CPU worker for reproducibility and predictable resource use in this example. Increase n_jobs only within your machine’s memory budget. Choose hyperparameters using validation data, and reserve the test set for a final comparison against simpler baselines.",
      ],
      language: "Python / scikit-learn",
      code: `from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import balanced_accuracy_score

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=7)
model = make_pipeline(
    SimpleImputer(strategy="median"),
    RandomForestClassifier(n_estimators=200, max_features="sqrt",
        min_samples_leaf=3, bootstrap=True, oob_score=True,
        random_state=7, n_jobs=1))
model.fit(X_train, y_train)
print("Test balanced accuracy:",
      balanced_accuracy_score(y_test, model.predict(X_test)))
print("OOB accuracy:", model[-1].oob_score_)`,
    },
    {
      id: "advanced",
      title: "Importance, calibration & related ensembles",
      paragraphs: [
        "Impurity-based importance accumulates split gains and can favor high-cardinality features. Permutation importance measures the change in a chosen score after shuffling a feature on held-out data. Correlated features can substitute for each other, so individual importance may understate their joint role. Report uncertainty across repeats.",
        "Averaged leaf proportions are not guaranteed to be calibrated probabilities. If decisions depend on probability quality, assess reliability curves and proper scoring rules. Fit calibration using separate data or cross-validation, never the test set used to report final performance.",
        "Extra Trees add more threshold randomness. Gradient-boosted trees instead build a sequence that corrects previous errors under an objective. They are not just larger random forests: their learning dynamics, regularization, and parallelism differ. Compare on the target dataset rather than assuming one ensemble always wins.",
      ],
    },
    {
      id: "limitations",
      title: "Bias, extrapolation & operational cost",
      paragraphs: [
        "A forest reduces variance but does not erase shared bias. If all trees rely on a spurious feature or the same unrepresentative sample, their average can be confidently wrong. More trees do not add information missing from the training set.",
        "Regression forests average leaf means and generally do not extrapolate targets beyond the observed training range. Sparse high-dimensional inputs and extremely complex relationships may favor other models. A large forest can consume substantial memory and introduce inference latency even when each individual tree is simple.",
        "For grouped or temporal tasks, random bootstrap/OOB evaluation may mix information across the deployment boundary. Use subject-level or chronological holdouts as appropriate. Record preprocessing, data availability times, class balance, latency, and memory alongside predictive scores.",
      ],
    },
    {
      id: "assessment",
      title: "Assessment & transfer",
      paragraphs: [
        "Explain why adding identical copies of a tree gives no variance benefit. Compare probability averaging with hard voting. Design a forest evaluation for customer histories where multiple rows belong to each customer, and explain why ordinary row-level OOB scores may mislead.",
      ],
      exercise: {
        prompt:
          "As T tends to infinity with ρ=0.1 and σ²=4, what variance remains?",
        solution:
          "The limit is ρσ² = 0.4. The independent component shrinks with T, while the correlated component remains under this simplified equal-correlation model.",
      },
    },
  ],
  references: [
    {
      title: "Random Forests / Breiman (2001)",
      url: "https://doi.org/10.1023/A:1010933404324",
    },
    {
      title: "scikit-learn / Forests of randomized trees",
      url: "https://scikit-learn.org/stable/modules/ensemble.html#forest",
    },
    {
      title: "scikit-learn / Permutation feature importance",
      url: "https://scikit-learn.org/stable/modules/permutation_importance.html",
    },
  ],
};
