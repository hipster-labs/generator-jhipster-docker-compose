# Docker-Compose File generator for JHipster applications

## Usage
This generator will check your subdirectories and find all the microservices and gateways you generated.
Then, it will generate a docker-compose.yml file which will run all those applications in one simple command :
```bash
docker-compose up
```

## Installation

This requires JHipster version greater than 3.0.
Clone this project, then run

```bash
npm link
```

Then go into a directory and run:

```bash
yo jhipster-docker-compose
```

Finally, you can launch all the applications by doing
```bash
docker-compose up
```
