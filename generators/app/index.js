'use strict';
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var shelljs = require('shelljs');
var crypto = require('crypto');

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

        checkDocker: function() {
            var done = this.async();

            shelljs.exec('docker -v', {silent:true},function(code, stdout, stderr) {
                if (stderr) {
                    this.log(chalk.yellow.bold('WARNING!') + ' docker is not found on your computer.\n' +
                        '         Read http://docs.docker.com/engine/installation/#installation\n');
                }
                done();
            }.bind(this));
        },

        checkDockerCompose: function() {
            var done = this.async();

            shelljs.exec('docker-compose -v', {silent:true}, function(code, stdout, stderr) {
                if (stderr) {
                    this.log(chalk.yellow.bold('WARNING!') + ' docker-compose is not found on your computer.\n' +
                        '         Read https://docs.docker.com/compose/install/\n');
                }
                done();
            }.bind(this));
        },

        loadConfig: function() {

            this.appsFolders = this.config.get('appsFolders');
            this.appConfigs = this.config.get('appConfigs');
            this.useElk = this.config.get('useElk');
            this.profile = this.config.get('profile');
            this.jwtSecretKey = this.config.get('jwtSecretKey');

            if(this.appsFolders !== undefined) {
                this.regenerate = true;
            }
        },

        findJhipsterApps: function() {
            if(this.regenerate) return;

            var files = shelljs.ls('-l',this.destinationRoot());
            this.appsFolders = [];
            files.forEach(function(file) {
                if(file.isDirectory()) {
                    if(shelljs.test('-f', file.name + '/.yo-rc.json')) {
                        this.appsFolders.push(file.name.match(/([^\/]*)\/*$/)[1]);
                    }
                }
            }, this);
        },

        getAppConfig: function() {
            if(this.abort || this.regenerate) return;

            this.appConfigs = [];

            for(var i = 0; i < this.appsFolders.length; i++) {
                var fileData = this.fs.readJSON(this.destinationPath(this.appsFolders[i]+'/.yo-rc.json'));
                var config = fileData['generator-jhipster'];
                if(config.applicationType !== 'monolith') {
                    this.appConfigs.push(config);
                } else {
                    this.appsFolders.splice(i,1);
                    i--;
                }
            }

            if(this.appsFolders.length === 0) {
                this.abort = true;
                this.log(chalk.red('\nNo microservice or gateway found in ' + this.destinationRoot()));
                this.log(chalk.red('\nMake sure you run the generator in a directory containing JHipster generated microservice or gateway'));
                return;
            } else {
                this.abort = false;
                this.log(chalk.green(this.appsFolders.length + ' applications found at ' + this.destinationRoot() + '\n'));
            }
        }
    },

    prompting: {
        askForApps: function() {
            if(this.abort || this.regenerate) return;
            var done = this.async();

            var prompts = [{
                type: 'checkbox',
                name: 'chosenApps',
                message: 'Which applications do you want in your DockerFile ?',
                choices: this.appsFolders,
                validate: function (input) {
                    if(input.length === 0) {
                        return 'Please choose at least one application';
                    } else return true;
                }
            }];

            this.prompt(prompts, function (props) {
                this.appsFolders = props.chosenApps;

                done();
            }.bind(this));
        },

        askForElk: function() {
            if(this.abort || this.regenerate) return;
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
        },

        askForProfile: function() {
            if(this.abort || this.regenerate) return;
            var done = this.async();

            var choices = ['dev', 'prod'];

            var prompts = [{
                type: 'list',
                name: 'profile',
                message: 'Which profile do you want to use ?',
                choices: choices,
                default: 0
            }];

            this.prompt(prompts, function(props) {
                this.profile = props.profile;

                done();
            }.bind(this));
        }
    },

    configuring: {
        checkImages: function() {
            if(this.abort) return;

            this.log('\nChecking Docker images in applications directories...');

            for (var i = 0; i < this.appsFolders.length; i++) {
                var imagePath = this.destinationPath(this.appsFolders[i] + '/target/docker/'+this.appConfigs[i].baseName.toLowerCase()+'-0.0.1-SNAPSHOT.war');
                if (!shelljs.test('-f', imagePath)) {
                    this.log(chalk.red('\nDocker Image not found at ' + imagePath));
                    this.log(chalk.red('Please run "mvn package docker:build" in ' + this.destinationPath(this.appsFolders[i]) + ' to generate Docker image'));
                    this.abort = true;
                }
            }

            if(!this.abort) this.log(chalk.green('Found Docker images, writing files...\n'));
        },

        generateJwtSecret: function() {
            if(this.jwtSecretKey === undefined) {
                this.jwtSecretKey = crypto.randomBytes(20).toString('hex');
            }
        },

        saveConfig: function() {
            if(this.abort) return;
            this.config.set('appsFolders', this.appsFolders);
            this.config.set('appConfigs', this.appConfigs);
            this.config.set('useElk', this.useElk);
            this.config.set('profile', this.profile);
            this.config.set('jwtSecretKey', this.jwtSecretKey);
        }
    },

    writing: {
        writeDockerCompose: function() {
            if(this.abort) return;

            this.template('_docker-compose.yml', 'docker-compose.yml');
        },

        writeRegistryFiles: function() {
            if(this.abort) return;

            this.copy('registry.yml', 'registry.yml');
            this.template('central-server-config/_application.yml', 'central-server-config/application.yml');
        },

        writeElkFiles: function() {
            if(!this.useElk || this.abort) return;

            this.copy('elk.yml', 'elk.yml');
            this.copy('log-monitoring/log-config/logstash.conf', 'log-monitoring/log-config/logstash.conf');
            this.copy('log-monitoring/log-data/.gitignore', 'log-monitoring/log-data/.gitignore');
        }
    },
    end: function() {
        this.log('\n' + chalk.bold.green('##### USAGE #####'));
        this.log('Launch all your applications by running : ' + chalk.cyan('docker-compose up -d\n'));
    }
});
