// Auction API Examples and Test Payloads

// 1. Start Auction Example
const startAuctionExample = {
  method: 'POST',
  url: '/api/deals/123e4567-e89b-12d3-a456-426614174000/start-auction',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  },
  body: {
    startPrice: 10000,
    minIncrement: 500,
    durationMinutes: 30,
    inviteeIds: [
      '123e4567-e89b-12d3-a456-426614174001',
      '123e4567-e89b-12d3-a456-426614174002',
      '123e4567-e89b-12d3-a456-426614174003'
    ]
  }
};

// 2. Place Bid Example
const placeBidExample = {
  method: 'POST',
  url: '/api/auctions/123e4567-e89b-12d3-a456-426614174100/bid',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  },
  body: {
    amount: 12500
  }
};

// 3. Get Auction Example
const getAuctionExample = {
  method: 'GET',
  url: '/api/auctions/123e4567-e89b-12d3-a456-426614174100',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};

// 4. Cancel Auction Example
const cancelAuctionExample = {
  method: 'POST',
  url: '/api/auctions/123e4567-e89b-12d3-a456-426614174100/cancel',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};

// 5. Socket Events Examples
const socketEvents = {
  // Join auction room
  joinAuction: {
    event: 'auction:join',
    data: {
      auctionDealRoomId: '123e4567-e89b-12d3-a456-426614174200'
    }
  },

  // Place bid via socket
  placeBid: {
    event: 'auction:bid',
    data: {
      auctionId: '123e4567-e89b-12d3-a456-426614174100',
      amount: 13000
    }
  },

  // Leave auction room
  leaveAuction: {
    event: 'auction:leave',
    data: {
      auctionDealRoomId: '123e4567-e89b-12d3-a456-426614174200'
    }
  }
};

// 6. Expected Socket Responses
const socketResponses = {
  auctionStarted: {
    event: 'auction:started',
    data: {
      auctionId: '123e4567-e89b-12d3-a456-426614174100',
      dealRoomId: '123e4567-e89b-12d3-a456-426614174200',
      startPrice: 10000,
      minIncrement: 500,
      endAt: '2024-01-01T12:30:00Z'
    }
  },

  bidUpdate: {
    event: 'auction:bid:update',
    data: {
      auctionId: '123e4567-e89b-12d3-a456-426614174100',
      bid: {
        id: '123e4567-e89b-12d3-a456-426614174300',
        auction_id: '123e4567-e89b-12d3-a456-426614174100',
        bidder_id: '123e4567-e89b-12d3-a456-426614174001',
        amount: 12500,
        created_at: '2024-01-01T12:00:00Z'
      },
      highestBid: 12500,
      bidderId: '123e4567-e89b-12d3-a456-426614174001'
    }
  },

  auctionClosed: {
    event: 'auction:closed',
    data: {
      auctionId: '123e4567-e89b-12d3-a456-426614174100',
      dealRoomId: '123e4567-e89b-12d3-a456-426614174200',
      winnerId: '123e4567-e89b-12d3-a456-426614174001',
      finalAmount: 15000,
      hasWinner: true
    }
  },

  auctionError: {
    event: 'auction:error',
    data: {
      error: 'You are not invited to this auction'
    }
  }
};

// 7. Inngest Event Examples
const inngestEvents = {
  auctionStarted: {
    name: 'auction.started',
    data: {
      auctionId: '123e4567-e89b-12d3-a456-426614174100',
      dealRoomId: '123e4567-e89b-12d3-a456-426614174200',
      endAt: '2024-01-01T12:30:00Z'
    }
  },

  orderCreated: {
    name: 'order.created',
    data: {
      orderId: '123e4567-e89b-12d3-a456-426614174400',
      dealRoomId: '123e4567-e89b-12d3-a456-426614174200',
      buyerId: '123e4567-e89b-12d3-a456-426614174001',
      sellerId: '123e4567-e89b-12d3-a456-426614174000',
      amount: 15000,
      auctionId: '123e4567-e89b-12d3-a456-426614174100'
    }
  }
};

// 8. Sample API Responses
const apiResponses = {
  startAuction: {
    auctionRoomId: '123e4567-e89b-12d3-a456-426614174200',
    auctionId: '123e4567-e89b-12d3-a456-426614174100'
  },

  placeBid: {
    bid: {
      id: '123e4567-e89b-12d3-a456-426614174300',
      auction_id: '123e4567-e89b-12d3-a456-426614174100',
      bidder_id: '123e4567-e89b-12d3-a456-426614174001',
      amount: 12500,
      created_at: '2024-01-01T12:00:00Z'
    },
    highestBid: 12500
  },

  getAuction: {
    auction: {
      id: '123e4567-e89b-12d3-a456-426614174100',
      dealRoomId: '123e4567-e89b-12d3-a456-426614174200',
      listingId: '123e4567-e89b-12d3-a456-426614174500',
      listingTitle: 'iPhone 13 Pro',
      sellerId: '123e4567-e89b-12d3-a456-426614174000',
      startPrice: 10000,
      minIncrement: 500,
      state: 'active',
      startAt: '2024-01-01T12:00:00Z',
      endAt: '2024-01-01T12:30:00Z',
      remainingSeconds: 1200
    },
    highestBid: {
      id: '123e4567-e89b-12d3-a456-426614174300',
      amount: 12500,
      bidderId: '123e4567-e89b-12d3-a456-426614174001',
      createdAt: '2024-01-01T12:00:00Z'
    },
    participants: [
      {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Seller',
        avatarUrl: 'https://example.com/avatar1.jpg',
        role: 'seller',
        joinedAt: '2024-01-01T12:00:00Z'
      },
      {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Alice Buyer',
        avatarUrl: 'https://example.com/avatar2.jpg',
        role: 'buyer',
        joinedAt: '2024-01-01T12:00:00Z'
      }
    ]
  },

  cancelAuction: {
    message: 'Auction cancelled successfully'
  }
};

// 9. Error Response Examples
const errorResponses = {
  notSeller: {
    error: 'You must be the seller to start an auction'
  },
  notInvited: {
    error: 'You are not invited to this auction'
  },
  auctionNotActive: {
    error: 'Auction is not active'
  },
  bidTooLow: {
    error: 'Bid must be at least $13000'
  },
  invalidAmount: {
    error: 'Bid amount must be greater than 0'
  },
  auctionNotFound: {
    error: 'Auction not found'
  },
  missingFields: {
    error: 'Missing required fields: startPrice, minIncrement, durationMinutes, inviteeIds'
  }
};

module.exports = {
  startAuctionExample,
  placeBidExample,
  getAuctionExample,
  cancelAuctionExample,
  socketEvents,
  socketResponses,
  inngestEvents,
  apiResponses,
  errorResponses
};
