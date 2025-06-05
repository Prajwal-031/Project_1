# Import necessary libraries for Flask and Machine Learning
from flask import Flask, render_template_string, jsonify
from sklearn.model_selection import GridSearchCV, train_test_split, cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import json # Used for handling JSON responses, though jsonify often handles it

# Initialize the Flask application
app = Flask(__name__)

# --- Machine Learning Logic (from your provided code) ---
# This function encapsulates the ML pipeline and returns the results
def run_iris_decision_tree_analysis():
    # Load data
    iris = load_iris()
    X = iris.data
    y = iris.target

    # Split data into training, validation, and test sets
    # Using 80% train, 10% validation, 10% test for simplicity and reproducibility
    X_train_full, X_test, y_train_full, y_test = train_test_split(X, y, test_size=0.05, random_state=42) # Reduced test size
    X_train, X_val, y_train, y_val = train_test_split(X_train_full, y_train_full, test_size=0.05 / 0.95, random_state=42) # Split train_full further

    # Create a pipeline with scaling and classifier
    pipeline = Pipeline([
        ('scaler', StandardScaler()),  # Regularization step: scaling the features
        ('classifier', DecisionTreeClassifier())
    ])

    # Define the parameter grid
    param_grid = {
        'classifier__max_depth': [3, 5, 7], # Reduced options for faster execution
        'classifier__min_samples_split': [2, 5], # Reduced options
        'classifier__criterion': ['gini', 'entropy']
    }

    # Set up Grid Search with cross-validation
    grid_search = GridSearchCV(estimator=pipeline, param_grid=param_grid, cv=3, scoring='accuracy', n_jobs=-1) # Reduced cv for faster execution, n_jobs for parallelism

    # Fit the model
    grid_search.fit(X_train, y_train)

    # Best hyperparameters
    best_params = grid_search.best_params_

    # Best model
    best_model = grid_search.best_estimator_

    # Evaluate the model on the validation set
    val_accuracy = best_model.score(X_val, y_val)

    # Evaluate the model on the test set
    test_accuracy = best_model.score(X_test, y_test)

    # Cross-validation scores (on the training data)
    cv_scores = cross_val_score(best_model, X_train, y_train, cv=3) # Reduced cv for faster execution
    mean_cv_score = cv_scores.mean()

    # Prepare results in a dictionary
    results = {
        "best_hyperparameters": best_params,
        "validation_accuracy": round(val_accuracy, 4), # Round for cleaner output
        "test_accuracy": round(test_accuracy, 4),
        "cross_validation_scores": [round(score, 4) for score in cv_scores],
        "mean_cross_validation_score": round(mean_cv_score, 4)
    }
    return results

# --- Flask Routes ---

# Define the main route to serve the HTML file
@app.route('/')
def index():
    # The HTML content will be rendered from the client-side HTML provided below
    # We are using render_template_string for self-contained code.
    return render_template_string("""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ML Iris Classifier</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #e0e0e0;
            padding: 20px;
            box-sizing: border-box;
            color: #333;
        }
        .container {
            background: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
            text-align: center;
            margin-top: 50px;
        }
        h1 {
            color: #4a4a4a;
            margin-bottom: 25px;
            font-size: 2.2em;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.05);
        }
        button {
            background-color: #4CAF50; /* Green */
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1.1em;
            transition: background-color 0.3s ease, transform 0.1s ease;
            margin-top: 20px;
        }
        button:hover {
            background-color: #45a049;
            transform: translateY(-2px);
        }
        button:active {
            transform: translateY(0);
        }
        #results {
            margin-top: 30px;
            padding: 20px;
            border: 1px dashed #ccc;
            border-radius: 8px;
            text-align: left;
            background-color: #f9f9f9;
        }
        #results p {
            margin-bottom: 8px;
            font-size: 1em;
        }
        #results strong {
            color: #0056b3;
        }
        .loading-spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            border-left-color: #4CAF50;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Iris Dataset Classification</h1>
        <p>Click the button below to run the Decision Tree Classifier on the Iris dataset and see its performance metrics.</p>
        <button id="runMlButton">Run ML Analysis</button>
        <div id="results">
            <p>Results will appear here after the analysis runs.</p>
        </div>
    </div>

    <script>
        document.getElementById('runMlButton').addEventListener('click', async () => {
            const resultsDiv = document.getElementById('results');
            const button = document.getElementById('runMlButton');

            // Show loading indicator
            resultsDiv.innerHTML = '<div class="loading-spinner"></div> Loading...';
            button.disabled = true;

            try {
                const response = await fetch('/run_ml');
                const data = await response.json();

                if (response.ok) {
                    resultsDiv.innerHTML = `
                        <p><strong>Best Hyperparameters:</strong> ${JSON.stringify(data.best_hyperparameters)}</p>
                        <p><strong>Validation Accuracy:</strong> ${data.validation_accuracy}</p>
                        <p><strong>Test Accuracy:</strong> ${data.test_accuracy}</p>
                        <p><strong>Cross-validation Scores:</strong> ${data.cross_validation_scores.join(', ')}</p>
                        <p><strong>Mean Cross-validation Score:</strong> ${data.mean_cross_validation_score}</p>
                    `;
                } else {
                    resultsDiv.innerHTML = `<p style="color: red;">Error: ${data.error || 'Failed to fetch results'}</p>`;
                }
            } catch (error) {
                resultsDiv.innerHTML = `<p style="color: red;">An error occurred: ${error.message}</p>`;
                console.error('Fetch error:', error);
            } finally {
                button.disabled = false;
            }
        });
    </script>
</body>
</html>
    """)

# Define the API endpoint to run the ML analysis
@app.route('/run_ml')
def run_ml():
    try:
        ml_results = run_iris_decision_tree_analysis()
        return jsonify(ml_results)
    except Exception as e:
        # Basic error handling for the ML part
        return jsonify({"error": str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True) # debug=True is good for development
