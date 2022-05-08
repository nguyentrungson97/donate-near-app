use std::collections::HashSet;

use near_sdk::{serde::{Serialize, Deserialize}, AccountId};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

use crate::{PostId, donation::DonationLog};

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Post {
    post_id: usize,
    title: String,
    body: String,
    author: AccountId,
    created_at: u64,
    expect_amount: u128,
    
    donation_logs: Vec<DonationLog>,
}

impl Post {
    pub fn new(post_id: usize, title: String, body: String, author: AccountId, created_at: u64, expect_amount: u128) -> Self {
        Self {
            post_id,
            title,
            body,
            author,
            created_at,
            expect_amount,

            donation_logs: Vec::new(),
        }
    }


    pub fn get_title(&self) -> String {
        self.title.clone()
    }

    pub fn get_post_id(&self) -> PostId {
        self.post_id
    }

    pub fn get_author(&self) -> AccountId {
        self.author.clone()
    }

    pub fn add_donation_logs(&mut self, donation_log: DonationLog) {
        self.donation_logs.push(donation_log);
    }

    pub fn get_body(&self) -> String {
        self.body.clone()
    }
}