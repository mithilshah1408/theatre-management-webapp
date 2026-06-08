-- hi jordy this is where you'll do testing:3 i put in one as an example and the readme has deeds on
-- NOTE: Comment out other sections to test each one independently

/*
********* BEGIN Section 1 Testing *********
TABLES: client, payment_method, ticket_sale
*/

-- +++++++ ADMIN +++++++
-- 1. insert into tables
INSERT INTO Administrator (email_address, password) VALUES
('mrboss@boss.com', 'boss123');
-- 2. view table
SELECT * FROM Administrator;

-- +++++++ CLIENT +++++++
-- 1. insert into tables
-- defined rewards programs 
SELECT '********* BEGIN Section 1 Testing *********';
INSERT INTO Client (email_address, name, address, password, movie_interests, rewards_program) VALUES
('jpine25@uic.edu', 'Jordy', '1234 Street, City', 'jordy123', 'Animation', FALSE),
('mrfrog@email.com', 'Mr. Frog', 'Frog Street, City', 'frog123', 'Comedy', TRUE),
('alpha_charles@email.com', 'Charlie', 'Smiling Friends HQ', 'charlie123', 'Comedy', TRUE);

-- undefined rewards programs 
INSERT INTO Client (email_address, name, address, password, movie_interests) VALUES
('glepiscool@email.com', 'Glep', 'Smiling Friends HQ', 'glep123', 'Comedy'),
('i_love_kids@email.com', 'Pim', 'Smiling Friends HQ', 'pim123', 'Comedy');
-- 2. view table
SELECT * FROM Client;

-- 3. try a query
SELECT * FROM Client WHERE address = 'Smiling Friends HQ';

-- +++++++ PAYMENT METHOD +++++++
-- 1. insert into table
-- pm for valid clients
INSERT INTO Paymentmethod (email_address) VALUES
('jpine25@uic.edu'),
('alpha_charles@email.com'),
('glepiscool@email.com');

SELECT * FROM Paymentmethod;

-- pm for invalid client (every payment method must have relation to client)
-- INSERT INTO Paymentmethod (email_address) VALUES
-- ('user@company.com'); -- this SHOULD trigger an error! actually it shouldnt lol we misread the description (cries)

INSERT INTO Debitcard (payment_id, card_number)
VALUES ((SELECT payment_id FROM Paymentmethod WHERE email_address = 'jpine25@uic.edu' LIMIT 1),
    '1111 2222 3333 4444');

INSERT INTO Creditcard (payment_id, card_number, billing_address)
VALUES ((SELECT payment_id FROM Paymentmethod WHERE email_address = 'alpha_charles@email.com' LIMIT 1),
    '5555 6666 7777 8888','Smiling Friends HQ');

INSERT INTO Debitcard (payment_id, card_number)
VALUES ((SELECT payment_id FROM Paymentmethod WHERE email_address = 'glepiscool@email.com' LIMIT 1),
    '9999 0000 1111 2222');

-- 2. view the table
SELECT * FROM Paymentmethod;
SELECT * FROM Debitcard;
SELECT * FROM Creditcard;

-- + DEBIT CARD +
-- 1. insert table
-- valid reference to pm
INSERT INTO Debitcard (payment_id, card_number) VALUES
(0, 'XXXX XXXX XXXX XXXX');

-- invalid reference to pm (SHOULD trigger an error, since all DebitCards are PM)
INSERT INTO Debitcard (payment_id, card_number) VALUES
(21391, 'AAAA AAAA AAAA AAAA');

-- 2. view table
SELECT * FROM Debitcard;

-- + CREDIT CARD +
-- 1. insert table
-- valid reference to pm
INSERT INTO Creditcard (payment_id, card_number, billing_address) VALUES
(1, 'YYYY YYYY YYYY YYYY', 'Smiling Friends HQ');

-- invalid reference to pm
INSERT INTO Creditcard (payment_id, card_number, billing_address) VALUES
(203, 'ABCD ABCD ABCD ABCD', 'Smiling Friends HQ');

-- invalid card_num, card_num is a duplicate
INSERT INTO Creditcard (payment_id, card_number, billing_address) VALUES
(2, 'YYYY YYYY YYYY YYYY', 'Smiling Friends HQ');

-- invalid p_id, p_id is duplicate
INSERT INTO Creditcard (payment_id, card_number, billing_address) VALUES
(2, 'ZZZZ ZZZZ ZZZZ ZZZZ', 'Smiling Friends HQ');

-- 2. view the table
SELECT * FROM Creditcard;

-- TODO: restructure this after move to section 2
-- +++++++ TICKET SALE +++++++
-- 1. insert table
-- registered client
-- INSERT INTO Ticketsale (order_id, payment_id, num_sold) VALUES
-- (1, 0, 2);

-- -- anonymous ticket (no payment method )
-- INSERT INTO Ticketsale (order_id, num_sold) VALUES
-- (0, 3);

-- 2. view table
SELECT * FROM Ticketsale;

DELETE FROM Administrator;
DELETE FROM Client;
DELETE FROM Theater;
DELETE FROM Paymentmethod;
DELETE FROM Ticketsale;

SELECT '********* END Section 1 Testing *********';
-- ********* END Section 1 Testing *********

/*
********* BEGIN Section 2 Testing *********
TABLES: screening, theater, movie, language
*/
SELECT '********* BEGIN Section 2 Testing *********';
-- inserting into table
INSERT INTO Theater (max_seats, features) VALUES
(100, '3D'),
(80, 'Fancy sound'),
(60, 'Standard');

-- view table
SELECT * FROM Theater;

-- +++++++ MOVIE +++++++
-- 1. insert into table
INSERT INTO Movie (title, release_date, runtime, original_language, major_studio) VALUES
('Interstellar', '2014-11-07', 169, 'English', TRUE),
('Spirited Away', '2001-07-20', 125, 'Japanese', TRUE),
('The Wind Rises', '2013-07-20', 126, 'Japanese', TRUE),
('Parasite', '2019-05-30', 132, 'Korean', FALSE);

-- 2. view table
SELECT * FROM Movie;

-- 3. this sholdnt work bc its a duplicate title...
INSERT INTO Movie (title, release_date, runtime, original_language, major_studio) VALUES
('Interstellar', '2014-11-07', 169, 'English', TRUE);


-- +++++++ LANGUAGE +++++++
-- 1. insert into table
INSERT INTO Language (language_name) VALUES
('English'),
('Japanese'),
('Korean'),
('Cantonese'),
('Tibetan'),
('Arabic'),
('Spanish'),
('Persian'),
('Turkish'),
('Romanian'),
('French');

-- 2. view table
SELECT * FROM Language;

-- 3. also should fail
INSERT INTO Language (language_name) VALUES
('Japanese');


-- +++++++ SCREENING +++++++
-- 1. insert valid screenings
INSERT INTO Screening (title, theater_id, screen_id, screening_date, timeslot) VALUES
('The Wind Rises', 3, 1, '2026-04-21', '17:45:00'),
('Interstellar', 1, 1, '2026-04-20', '19:00:00'),
('Spirited Away', 2, 1, '2026-04-20', '18:30:00'),
('Parasite', 1, 2, '2026-04-21', '21:30:00');

-- 2. view table
SELECT * FROM Screening;

--here im just testing failures based on relations that need to exist together
--example: cant have the same theater diff movies at the same time and date
-- cant have a movie that doenst even exist being screened\
-- and cant have a movie playing at non existent theater


-- 3. invalid insert: same theater, same date, same timeslot should fail!!!!! pls fail pls fail pls fail
INSERT INTO Screening (title, theater_id, screen_id, screening_date, timeslot) VALUES
('Parasite', 1, 3, '2026-04-20', '19:00:00');

-- 4. bc this movie does not exist in movie table, should fail
INSERT INTO Screening (title, theater_id, screen_id, screening_date, timeslot) VALUES
('Fragment of my imagination movie', 2, 2, '2026-04-22', '20:00:00');

-- 5. invalid insert: .....theater does not exist, should fail
INSERT INTO Screening (title, theater_id, screen_id, screening_date, timeslot) VALUES
('Interstellar', 99, 1, '2026-04-22', '16:00:00');

-- +++++++ MOVIELANGUAGE +++++++
-- 1. insert valid movie-language pairs
INSERT INTO MovieLanguage (title, language_name) VALUES
('Interstellar', 'English'),
('Interstellar', 'French'),
('Spirited Away', 'Japanese'),
('Spirited Away', 'English'),
('The Wind Rises', 'Japanese'),
('The Wind Rises', 'English'),
('Parasite', 'Korean'),
('Parasite', 'English');

-- 2. view table
SELECT * FROM MovieLanguage;

-- 3. invalid insert: duplicate pair should fail
INSERT INTO MovieLanguage (title, language_name) VALUES
('Parasite', 'Korean');

-- 4. invalid insert, movie does not exist, should fail.
INSERT INTO MovieLanguage (title, language_name) VALUES
('Not A Real Movie', 'English');

-- 5. invalid insert...language does not exist, should fail
INSERT INTO MovieLanguage (title, language_name) VALUES
('Interstellar', 'German');

--some general queries 

--movies available in Japanese
SELECT * FROM MovieLanguage
WHERE language_name = 'Japanese';

-- screenings on this date
SELECT * FROM Screening
WHERE screening_date = '2026-04-20';

--show titles with theater/time info
SELECT title, theater_id, screening_date, timeslot
FROM Screening;

DELETE FROM MovieLanguage;
DELETE FROM Screening;
DELETE FROM Language;
DELETE FROM Movie;
DELETE FROM Theater;

SELECT '********* END Section 2 Testing *********';
-- ********* END Section 2 Testing *********


/*
********* BEGIN Section 3 Testing *********
TABLES: award, person
*/
-- +++++++ PERSON +++++++
SELECT '********* BEGIN Section 3 Testing *********';
-- 0. setup
INSERT INTO Movie (title, release_date, runtime, original_language, major_studio) VALUES
('Interstellar', '2014-11-07', 169, 'English', TRUE),
('Spirited Away', '2001-07-20', 125, 'Japanese', TRUE),
('The Wind Rises', '2013-07-20', 126, 'Japanese', TRUE),
('Parasite', '2019-05-30', 132, 'Korean', FALSE);

-- 1. insert table
INSERT INTO Person (name, birthday, biography) VALUES
('Christopher Nolan', '1970-07-30', 'British-American filmmaker known for Interstellar and The Dark Knight.'),
('Matthew McConaughey', '1969-11-04', 'American actor known for Interstellar and Dallas Buyers Club.'),
('Hayao Miyazaki', '1941-01-05', 'Japanese animator and filmmaker, co-founder of Studio Ghibli.'),
('Bong Joon-ho', '1969-09-14', 'South Korean filmmaker known for Parasite.');

-- 2. view table
SELECT * FROM Person;


-- +++++++ AWARD +++++++
-- 1. insert table
INSERT INTO Award (award_name, year, role, name, title) VALUES
('Oscar', 2020, 'director', 'Bong Joon-ho', 'Parasite'),
('Academy Honorary Award', 2014, 'director', 'Hayao Miyazaki', 'The Wind Rises'),
('Oscar', 2015, 'director', 'Christopher Nolan', 'Interstellar');

-- 2. view table
SELECT * FROM Award;

-- 3. constraint test: person must exist
INSERT INTO Award (award_name, year, role, name, title) VALUES
('Oscar', 2020, 'actor', 'John Doe', 'Interstellar'); -- should ERROR (person doesn't exist)

-- 4. constraint test: movie must exist
INSERT INTO Award (award_name, year, role, name, title) VALUES
('Oscar', 2020, 'director', 'Bong Joon-ho', 'Inception'); -- should ERROR (movie doesn't exist)


-- +++++++ DIRECTED +++++++
-- 1. insert table
INSERT INTO Directed (name, title) VALUES
('Christopher Nolan', 'Interstellar'),
('Hayao Miyazaki', 'Spirited Away'),
('Hayao Miyazaki', 'The Wind Rises'),
('Bong Joon-ho', 'Parasite');

-- 2. view table
SELECT * FROM Directed;

-- 3. constraint test: duplicate entry
INSERT INTO Directed (name, title) VALUES
('Christopher Nolan', 'Interstellar'); -- should ERROR (primary key violation)

-- 4. constraint test: person must exist
INSERT INTO Directed (name, title) VALUES
('John Doe', 'Interstellar'); -- should ERROR (foreign key violation)


-- +++++++ PRODUCED +++++++
-- 1. insert table
INSERT INTO Produced (name, title) VALUES
('Christopher Nolan', 'Interstellar'),
('Hayao Miyazaki', 'Spirited Away'),
('Hayao Miyazaki', 'The Wind Rises'),
('Bong Joon-ho', 'Parasite');

-- 2. view table
SELECT * FROM Produced;

-- 3. constraint test: duplicate entry
INSERT INTO Produced (name, title) VALUES
('Bong Joon-ho', 'Parasite'); -- should ERROR (primary key violation)


-- +++++++ SCRIPTED +++++++
-- 1. insert table
INSERT INTO Scripted (name, title) VALUES
('Christopher Nolan', 'Interstellar'),
('Hayao Miyazaki', 'Spirited Away'),
('Hayao Miyazaki', 'The Wind Rises'),
('Bong Joon-ho', 'Parasite');

-- 2. view table
SELECT * FROM Scripted;

-- 3. constraint test: duplicate entry
INSERT INTO Scripted (name, title) VALUES
('Hayao Miyazaki', 'Spirited Away'); -- should ERROR (primary key violation)


-- +++++++ STARS IN +++++++
-- 1. insert table
INSERT INTO StarsIn (name, title, character_name) VALUES
('Matthew McConaughey', 'Interstellar', 'Cooper'),
('Matthew McConaughey', 'Interstellar', 'Old Cooper'); -- same actor, second character

-- 2. view table
SELECT * FROM StarsIn;

-- 3. constraint test: same actor, same movie, same character should ERROR
INSERT INTO StarsIn (name, title, character_name) VALUES
('Matthew McConaughey', 'Interstellar', 'Cooper'); -- should ERROR (primary key violation)

-- 4. constraint test: person must exist
INSERT INTO StarsIn (name, title, character_name) VALUES
('John Doe', 'Interstellar', 'Cooper'); -- should ERROR (foreign key violation)

-- 5. view full actor-movie-character breakdown
SELECT name AS actor, title AS movie, character_name
FROM StarsIn;

-- remove tables
DELETE FROM Person;
DELETE FROM Award;
DELETE FROM Produced;
DELETE FROM Scripted;
DELETE FROM StarsIn;
-- ********* END Section 3 Testing *********
SELECT '********* END Section 3 Testing *********';


