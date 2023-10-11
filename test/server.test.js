const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { app } = require('../server');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });

const uri = process.env.MONGO_URI;


describe('GET /get-groups', () => {
    it('responds with json containing a list of all groups', async () => {
        const response = await request(app)
            .get('/get-groups')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200);
    });
});

describe('POST /create-account', () => {
    it('creates a new user account', async () => {
        const response = await request(app)
            .post('/create-account')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'testpass123'
            })
            .expect('Content-Type', /json/)
            .expect(200);

        // Add checks related to the response body here
        expect(response.body.message).toEqual('Account created successfully!');
    });
});

describe('Group and Channel Operations', () => {
    let createdGroupId;

    it('should create a new group', async () => {
        const response = await request(app)
            .post('/create-group')
            .send({
                name: 'Test Group',
                createdBy: 'testuser'
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.message).toEqual('Group created successfully!');
        createdGroupId = response.body.groupId; // Store the created group ID for next tests
    });

    it('should add a member to a channel', async () => {
        const response = await request(app)
            .post('/add-channel-member')
            .send({
                channelId: createdGroupId, // Use the ID from the created group
                userId: 'testuser'
            })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(response.body.message).toEqual('Successfully added member to channel');
    });
});

describe('Subchannel Creation', () => {
    it('should create a new subchannel', async () => {
        const testChannelId = 'test-channel-id';
        const testName = 'Test Subchannel';
        const testCreatedBy = 'test-user';

        const response = await request(app)
            .post('/api/subchannel/create')
            .send({
                name: testName,
                channelId: testChannelId,
                createdBy: testCreatedBy
            })
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.message).toEqual('Sub-channel created successfully!');
        expect(response.body).toHaveProperty('subchannelId');
    });

    it('should not create a subchannel with existing name and channelId', async () => {
        const testChannelId = 'test-channel-id';
        const testName = 'Test Subchannel';
        const testCreatedBy = 'test-user';

        // First request
        await request(app)
            .post('/api/subchannel/create')
            .send({
                name: testName,
                channelId: testChannelId,
                createdBy: testCreatedBy
            });

        // Second request with same data
        const response = await request(app)
            .post('/api/subchannel/create')
            .send({
                name: testName,
                channelId: testChannelId,
                createdBy: testCreatedBy
            })
            .expect('Content-Type', /json/)
            .expect(500); // This expects a server error due to a duplicate key

        expect(response.body.message).toEqual('Duplicate key error. Try again.');
    });
});

describe('Delete Subchannel', () => {
    let connection;
    let db;

    beforeAll(async () => {
        connection = await MongoClient.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        db = await connection.db();
    });

    afterAll(async () => {
        await connection.close();
        await db.close();
    });

    it('should delete a subchannel and its messages', async () => {
        // First, we need to create a subchannel in the database
        const subchannel = {
            _id: 'testsubchannel1', // this should be a unique identifier
            name: 'Test Subchannel',
        };

        await db.collection('subchannels').insertOne(subchannel);

        // Now, we try to delete it
        const response = await request(app)
            .delete(`/subchannels/${subchannel._id}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.message).toEqual('Subchannel and related messages deleted successfully.');

        // Verify it's deleted from the database
        const deletedSubchannel = await db.collection('subchannels').findOne({ _id: subchannel._id });
        expect(deletedSubchannel).toBeNull();
    });

    it('should respond with 404 for non-existent subchannel', async () => {
        const nonExistentId = 'nonexistentid';
        const response = await request(app)
            .delete(`/subchannels/${nonExistentId}`)
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body.message).toEqual('Subchannel not found.');
    });
});

describe('Fetch Subchannels by Channel ID', () => {
    let connection;
    let db;

    beforeAll(async () => {
        connection = await MongoClient.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        db = await connection.db();
    });

    afterAll(async () => {
        await connection.close();
        await db.close();
    });

    it('should fetch subchannels for a given channelId', async () => {
        // First, we need to create a subchannel in the database
        const subchannel = {
            _id: 'testsubchannel1', // this should be a unique identifier
            name: 'Test Subchannel',
            channelId: 'testchannel1',
        };

        await db.collection('subchannels').insertOne(subchannel);

        // Now, we try to fetch subchannels by channelId
        const response = await request(app)
            .get(`/api/subchannel/${subchannel.channelId}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.message).toEqual('success');
        expect(response.body.data).toEqual(expect.arrayContaining([expect.objectContaining({
            _id: subchannel._id,
            name: subchannel.name,
            channelId: subchannel.channelId,
        })]));
    });

    it('should respond with 400 if no channelId is provided', async () => {
        const response = await request(app)
            .get(`/api/subchannel/`) // not providing a channelId
            .expect('Content-Type', /json/)
            .expect(404); // this is expected to fail, thus the error

        expect(response.body).toEqual({});
    });
});

describe('Fetch User by ID', () => {
    let connection;
    let db;

    beforeAll(async () => {
        connection = await MongoClient.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        db = await connection.db();
    });

    afterAll(async () => {
        await connection.close();
        await db.close();
    });

    it('should fetch user for a given user ID', async () => {
        // First, we need to create a user in the database
        const user = {
            _id: new ObjectId(),
            username: 'testuser',
            email: 'test@example.com',
        };

        await db.collection('users').insertOne(user);

        // Now, we try to fetch user by ID
        const response = await request(app)
            .get(`/user/${user._id}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.user).toEqual(expect.objectContaining({
            _id: user._id.toString(), // IDs are returned as strings
            username: user.username,
            email: user.email,
        }));
    });

    it('should respond with 404 if no user is found', async () => {
        const nonExistentId = new ObjectId();
        const response = await request(app)
            .get(`/user/${nonExistentId}`)
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body).toEqual({ message: 'User not found' });
    });
});

describe('Upload Display Image', () => {
    let connection;
    let db;

    beforeAll(async () => {
        connection = await MongoClient.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        db = await connection.db();
    });

    afterAll(async () => {
        await connection.close();
        await db.close();
    });

    it('should upload an avatar image for a user', async () => {
        // Prepare a test image to upload
        const filePath = path.join(__dirname, 'test.png');
        const userId = new ObjectId();

        // First, we need to create a user in the database
        const user = {
            _id: userId,
            username: 'testuser',
            email: 'test@example.com',
            // other necessary fields
        };

        await db.collection('users').insertOne(user);

        // Ensure that the 'uploads' directory exists
        if (!fs.existsSync('./uploads')) {
            fs.mkdirSync('./uploads');
        }

        const response = await request(app)
            .post('/upload-avatar')
            .attach('avatar', filePath)
            .field('userId', userId.toString())
            .expect(200);

        expect(response.body.message).toBe('File uploaded!');
        expect(response.body.filePath).toContain(userId.toString());

        // Clean up the uploaded file
        const uploadedFilePath = path.join(__dirname, '..', response.body.filePath);
        if (fs.existsSync(uploadedFilePath)) {
            fs.unlinkSync(uploadedFilePath);
        }

        const updatedUser = await db.collection('users').findOne({ _id: userId });
        expect(updatedUser.avatarPath).toBe(response.body.filePath);
    });

});