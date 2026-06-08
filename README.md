README.md

Hi :4 this is how to set up ur docker and run the scripts

1. Make sure your docker is up and running, in the 480project directory run

docker compose up -d

2. Make sure its actually running

docker ps

**You should see cinema_db

3. Connect to the db

docker exec -it cinema_db psql -U postgres -d cinema

**this opens cinema=# psql! then u can just exit it via \q

4. Run the cinema sql file

docker exec -i cinema_db psql -U postgres -d cinema < cinema.sql

5. Make sure the tables r there lol by going back into psql 

docker exec -it cinema_db psql -U postgres -d cinema

Then run

\dt

7. Run this to see the tables yayayaya

cinema-# \dt
             List of relations
 Schema |     Name      | Type  |  Owner   
--------+---------------+-------+----------
 public | administrator | table | postgres
 public | client        | table | postgres
 public | movie         | table | postgres
 public | person        | table | postgres
 public | theater       | table | postgres
(5 rows)


8. Test the testing file!

docker exec -i cinema_db psql -U postgres -d cinema < testing.sql

—-------—-------—-------—-------—-------—-------—-------—-------—-------—-------—-------—-------

These are steps for when you need to change the cinema.sql file and update any entries, you have to delete and remake the container and run the script again so the tables update


docker compose down -v
docker compose up -d
docker exec -i cinema_db psql -U postgres -d cinema < cinema.sql
docker exec -i cinema_db psql -U postgres -d cinema < testing.sql

Then check if it all worked/updated

docker exec -it cinema_db psql -U postgres -d cinema
\dt

Hopefully this all helps! 


----------------------------------------------------

Application 
note: was gonna dockerize this app so u guys can just run it locally w/o installing but we can do that later im lazy rn :4

1. create VE first to install flask stuff

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install flask flask-cors psycopg2-binary

2. cd out back to 480project/ and run

(first line might be optional)

docker compose down -v 
docker compose up -d
docker exec -i cinema_db psql -U postgres -d cinema < cinema.sql
docker exec -i cinema_db psql -U postgres -d cinema < testing.sql

3. check (otherwise ur front end will be empty..)

docker exec -it cinema_db psql -U postgres -d cinema
\dt

3. run the backend from backend/

source .venv/bin/activate
python3 application.py

*** it should say like:

* Running on http://127.0.0.1:5000

*** and if you go to 

http://127.0.0.1:5000/movies

it shows u the result of the query ran from the backend as a JSON object

4. run front end from frontend/

npm install
npm install react-router-dom
npm run dev

then open localhost it launches

Hopefully this helps, if u have any questions/run into probs lmk