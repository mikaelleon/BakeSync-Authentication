// cucumber.config.js
module.exports = {
    default: {
      require: [
        'tests/step-definitions/**/*.ts',
        'tests/support/**/*.ts'
      ],
      format: [
        'progress-bar',
        'html:reports/cucumber-report.html',
        'json:reports/cucumber-report.json'
      ],
      formatOptions: {
        snippetInterface: 'async-await'
      },
      paths: ['tests/features/**/*.feature'],
      publishQuiet: true,
      dryRun: false,
      failFast: false
    }
  };