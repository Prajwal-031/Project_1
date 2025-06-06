import argparse
import joblib
import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import GridSearchCV, train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC


def load_data():
    data = load_iris()
    return data.data, data.target


def split_data(X, y):
    X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.4, random_state=42)
    X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.5, random_state=42)
    return X_train, X_val, X_test, y_train, y_val, y_test


def get_classifier(name):
    if name == 'tree':
        return DecisionTreeClassifier()
    elif name == 'svm':
        return SVC()
    elif name == 'rf':
        return RandomForestClassifier()
    else:
        raise ValueError("Unsupported classifier")


def create_pipeline(classifier):
    return Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', classifier)
    ])


def define_param_grid(classifier_name):
    if classifier_name == 'tree':
        return {
            'classifier__max_depth': [3, 5, 7, 10],
            'classifier__min_samples_split': [2, 5, 10],
            'classifier__criterion': ['gini', 'entropy']
        }
    elif classifier_name == 'svm':
        return {
            'classifier__C': [0.1, 1, 10],
            'classifier__kernel': ['linear', 'rbf']
        }
    elif classifier_name == 'rf':
        return {
            'classifier__n_estimators': [50, 100],
            'classifier__max_depth': [5, 10, None],
            'classifier__criterion': ['gini', 'entropy']
        }


def tune_hyperparameters(pipeline, param_grid, X_train, y_train):
    grid_search = GridSearchCV(estimator=pipeline, param_grid=param_grid, cv=5, scoring='accuracy')
    grid_search.fit(X_train, y_train)
    print("Best Hyperparameters:", grid_search.best_params_)
    return grid_search.best_estimator_


def evaluate_model(model, X_val, y_val, X_test, y_test, X_train, y_train):
    val_accuracy = model.score(X_val, y_val)
    test_accuracy = model.score(X_test, y_test)
    print("Validation Accuracy:", val_accuracy)
    print("Test Accuracy:", test_accuracy)

    print("\nClassification Report (Test Data):")
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))

    scores = cross_val_score(model, X_train, y_train, cv=5)
    print("Cross-validation scores:", scores)
    print("Mean cross-validation score:", scores.mean())


def save_model(model, filename="best_model.pkl"):
    joblib.dump(model, filename)
    print(f"Model saved to {filename}")


if _name_ == "_main_":
    parser = argparse.ArgumentParser(description="Train ML model with hyperparameter tuning.")
    parser.add_argument('--classifier', type=str, default='tree',
                        choices=['tree', 'svm', 'rf'],
                        help="Classifier to use: tree, svm, or rf")
    parser.add_argument('--save', action='store_true', help="Save the best model to file.")
    args = parser.parse_args()

    X, y = load_data()
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(X, y)

    classifier = get_classifier(args.classifier)
    pipeline = create_pipeline(classifier)
    param_grid = define_param_grid(args.classifier)

    best_model = tune_hyperparameters(pipeline, param_grid, X_train, y_train)
    evaluate_model(best_model, X_val, y_val, X_test, y_test, X_train, y_train)

    if args.save:
        save_model(best_model)
