/*
 * Decentrablog
 *
 * Learn more about writing NEAR smart contracts with Rust:
 * https://github.com/near/near-sdk-rs
 *
 */

// To conserve gas, efficient serialization is achieved through Borsh (http://borsh.io/)
use donation::DonationLog;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, setup_alloc, AccountId, Promise};
use near_sdk::collections::{UnorderedMap};
use near_sdk::serde::{Serialize, Deserialize};
use post::Post;

setup_alloc!();

type PostId = usize;

mod post;
mod donation;

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Donate {
    owner: AccountId,
    user_posts: UnorderedMap<AccountId, Vec<usize>>,
    posts: UnorderedMap<PostId, Post>,

    next_post_id: usize,
    next_donation_id: usize,
}


impl Default for Donate {
  fn default() -> Self {
    Self {
      owner: env::signer_account_id(),
      user_posts: UnorderedMap::new(b"user_posts".to_vec()),
      posts: UnorderedMap::new(b"posts".to_vec()),

      next_post_id: 0,
      next_donation_id: 0,
    }
  }
}

#[near_bindgen]
impl Donate {
    pub fn create_post(&mut self, title: String, body: String, expect_amount: u128) -> usize {
        let post_id = self.next_post_id;

        let post =  Post::new(post_id, title, body, env::predecessor_account_id(), env::block_timestamp(), expect_amount);
        
        self.posts.insert(&post_id, &post);
        self.next_post_id = self.next_post_id + 1;

        let mut user_posts = self.user_posts.get(&env::predecessor_account_id()).unwrap_or(vec![]);
        
        user_posts.push(post_id);
        self.user_posts.insert(&env::predecessor_account_id(), &user_posts); 

        post_id
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner.clone()
    }

    pub fn get_post(&self, post_id: usize) -> Option<Post> {
        self.posts.get(&post_id)
    }

    pub fn get_posts(&self) -> Vec<Post> {
        let mut posts = Vec::new();

        for post_id in self.posts.keys() {
            posts.push(self.posts.get(&post_id).unwrap());
        }

        posts
    }

    pub fn get_user_posts(&self, user_id: AccountId) -> Vec<Post> {
        if self.user_posts.get(&user_id).unwrap_or(vec![]).len() == 0 {
            return vec![];
        }

        let mut posts = Vec::new();

        for post_id in self.user_posts.get(&user_id).unwrap() {
            posts.push(self.posts.get(&post_id).unwrap());
        }

        posts
    }



    #[payable]
    pub fn donate(&mut self, post_id: usize, amount: u128, message: String) {
        
        let post = self.posts.get(&post_id).unwrap();
        assert!(amount >= 1, "Số Near donate phải lớn hơn 0");
        assert!(env::account_balance() >= amount, "Bạn không đủ số dư");

        let author = post.get_author();
        let amount = amount;
        
        Promise::new(author).transfer(amount).then(self.save_to_donation_log(post_id, amount, message));
    }

    #[private]
    fn save_to_donation_log(&mut self, post_id: usize, amount: u128, message: String) -> Promise {
        let created_at = env::block_timestamp();

        let donation_log = DonationLog::new(self.next_donation_id, amount, env::predecessor_account_id(), created_at, message, post_id);

        let mut post = self.posts.get(&post_id).unwrap();
        post.add_donation_logs(donation_log);
        self.posts.insert(&post_id, &post);

        let donor = env::predecessor_account_id();

        Promise::new(donor)
    }

   
}

