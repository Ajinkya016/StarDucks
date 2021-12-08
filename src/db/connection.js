//create connection betweeen nodejs app and mongodb
const mongoose = require('mongoose');


mongoose.connect(`mongodb+srv://StarDucksAdmin:TheAjinkya111@users.yipik.mongodb.net/users?retryWrites=true&w=majority`, {
    useCreateIndex: true,
    useNewUrlParser: true,
    // useUnifiedTopology: true
})
.then(() => console.log('Database connected'))
.catch(e => console.log(e));
