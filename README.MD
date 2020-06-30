# WhiteBox Code Challenge

## Setting up 

make sure you have docker-compose and docker installed on your local machine

## Running 

./startup.sh 
or 
docker-compose up --build

When first time running, npm error expected on the console because of database 
takes longer to build. Retry logic is implemented in index.js to connect to database.

## Output

Output File should be located in the node folder

## Cleaning up

control-c to exit out of running containers

docker-compose down

