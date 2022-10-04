const { gql } = require("apollo-server-express");
const { User } = require("../../models/index");
const { ApolloError } = require("apollo-server-errors");
const fetch = require("node-fetch");
const secretKey = "sk_test_a5cc80a13e56bfefd86b2db400e79ba8ee561382";
const { distance, closest } = require("fastest-levenshtein");
// const jwt = require("jsonwebtoken")

const typeDefs = gql`
  type User {
    AccountNumber: String!
    AccountName: String!
    BankCode: String!
    isVerified: Boolean!
  }

  input getUserInput {
    AccountNumber: String!
    AccountName: String!
  }
  type getAccountName{
    AccountName:String
  }

  type Query {
    getUser(aUser:getUserInput):getAccountName
  }


  input CreateUserInput {
    AccountNumber: String!
    AccountName: String!
    BankCode: String!
  }

  type Mutation {
    CreateUser(userInput: CreateUserInput): User
  }
`;

const resolvers = {
  Query: {
    getUser: async (parent, args)=>{
      try {
        const AccountNumber = args.aUser.AccountNumber
        const AccountName = args.aUser.AccountName
        const user = await User.findOne({AccountNumber:AccountNumber,AccountName:AccountName}).lean()
        // console.log(args)
        console.log(user.AccountName)
        return user
      } catch (error) {
        console.log(error)
      }
    }
  },

  Mutation: {
    CreateUser: async (parent, args) => {
      try {
        const verifyBank = await fetch(
          "https://api.paystack.co/bank/resolve?account_number=" +
            String(args.userInput.AccountNumber) +
            "&bank_code=" +
            String(args.userInput.BankCode),
          {
            method: "GET",
            headers: {
              Authorization: "Bearer " + secretKey,
            },
          }
        );
        let Data = await verifyBank.json();
    
        const Ld = distance(args.userInput.AccountName, Data.data.account_name);
        if (Ld <= 2) {
          const user = new User({ ...args.userInput });
          user.isVerified = true;
          const isSaved = await user.save();
          return isSaved;
        }
        console.log(Ld)
        const notVerified = new User({ ...args.userInput })
        notVerified.isVerified = false
        const saved = await notVerified.save()
        return saved
       
      } catch (error) {
        // console.log(error);
        // console.log(error.response.data)
      }
    },
  },
};

module.exports = { typeDefs, resolvers };
