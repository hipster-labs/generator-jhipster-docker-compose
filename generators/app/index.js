'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var shelljs = require('shelljs');

module.exports = yeoman.generators.Base.extend({
    initializing: {
        printJHipsterLogo: function() {
            this.log(' \n' +
                chalk.green('        ██') + chalk.red('  ██    ██  ████████  ███████    ██████  ████████  ████████  ███████\n') +
                chalk.green('        ██') + chalk.red('  ██    ██     ██     ██    ██  ██          ██     ██        ██    ██\n') +
                chalk.green('        ██') + chalk.red('  ████████     ██     ███████    █████      ██     ██████    ███████\n') +
                chalk.green('  ██    ██') + chalk.red('  ██    ██     ██     ██             ██     ██     ██        ██   ██\n') +
                chalk.green('   ██████ ') + chalk.red('  ██    ██  ████████  ██        ██████      ██     ████████  ██    ██\n'));
            this.log(chalk.white.bold('                            http://jhipster.github.io\n'));
            this.log(chalk.white('Welcome to the JHipster Docker Compose Generator '));
            this.log(chalk.white('Files will be generated in folder: ' + chalk.yellow(this.destinationRoot())));
        },

        findJhipsterApps: function() {
            var files = shelljs.ls('-l',this.destinationRoot());
            this.apps = [];
            files.forEach(function(file) {
                if(file.isDirectory()) {
                    if(shelljs.test('-f', file.name + '/.yo-rc.json')) {
                        this.apps.push(file.name.match(/([^\/]*)\/*$/)[1]);
                    }
                }
            }, this);

            if(this.apps.length === 0) {
                this.isEmpty = true;
                this.log(chalk.red('\nNo applications found in ' + this.destinationRoot()));
                this.log(chalk.red('\nMake sure you run the generator in a directory containing JHipster generated applications'));
                return;
            } else {
                this.isEmpty = false;
                this.log(chalk.green(this.apps.length + ' applications found at ' + this.destinationRoot() + '\n'));
            }
        }
    },

    prompting: {
        askForApps: function() {
            if(this.isEmpty) return;
            var done = this.async();

            var prompts = [{
                type: 'checkbox',
                name: 'chosenApps',
                message: 'Which applications do you want in your DockerFile ?',
                choices: this.apps,
                validate: function (input) {
                    if(input.length === 0) {
                        return 'Please choose at least one application';
                    } else return true;
                }
            }];

            this.prompt(prompts, function (props) {
                this.apps = props.chosenApps;

                done();
            }.bind(this));
        },

        askForElk: function() {
            if(this.isEmpty) return;
            var done = this.async();

            var prompts = [{
                type: 'confirm',
                name: 'elk',
                message: 'Do you want ELK to monitor your applications ?',
                default: true
            }];

            this.prompt(prompts, function(props) {
                this.useElk = props.elk;

                done();
            }.bind(this));
        }
    },

    configuring: {
        getAppConfig: function() {
            if(this.isEmpty) return;

            this.appConfigs = [];
            for(var i=0;i<this.apps.length;i++) {
                var fileData = this.fs.readJSON(this.destinationPath(this.apps[i]+'/.yo-rc.json'));
                this.appConfigs.push(fileData['generator-jhipster']);
            }
        }
    },

    writing: {
        writeDockerCompose: function() {
            if(this.isEmpty) return;

            this.template('_docker-compose.yml', 'docker-compose.yml');
        },

        writeRegistryFiles: function() {
            if(this.isEmpty) return;

            this.copy('registry.yml', 'registry.yml');
            this.copy('central-server-config/application.yml', 'central-server-config/application.yml');
        },

        writeElkFiles: function() {
            if(!this.useElk || this.isEmpty) return;

            this.copy('elk.yml', 'elk.yml');
            this.copy('log-monitoring/log-config/logstash.conf', 'log-monitoring/log-config/logstash.conf');
            this.copy('log-monitoring/log-data/.gitignore', 'log-monitoring/log-data/.gitignore');
        }
    }
});
