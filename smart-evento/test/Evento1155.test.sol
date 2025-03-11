// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;


import "forge-std/Test.sol";
import "../src/Evento1155.sol";

contract Evento1155Test is Test {
    Evento1155 public evento;
    address public owner;
    address public user1;
    address public user2;
    address public user3;
    // Test constants
    string constant BASE_URI = "https://evento.example/metadata/";
    bytes32[] emptyProof;
    
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);
        
        // Deploy contract

        evento = new Evento1155(BASE_URI);
        evento.addTicketType("COMMON", 1000, 0.1 ether, 0.08 ether, 0.05 ether, true);
        evento.addTicketType("VIP", 1000, 0.5 ether, 0.4 ether, 0.3 ether, true);
        evento.addTicketType("PREMIUM", 1000, 0.4 ether, 0.3 ether, 0.2 ether, true);
        evento.addTicketType("GOLD", 1000, 0.5 ether, 0.4 ether, 0.3 ether, true);
        evento.addTicketType("SILVER", 1000, 0.4 ether, 0.3 ether, 0.2 ether, true);
        evento.addTicketType("BRONZE", 1000, 0.3 ether, 0.2 ether, 0.1 ether, true);
        evento.addTicketType("IRON", 1000, 0.2 ether, 0.1 ether, 0.05 ether, true);
        
        // Fund test accounts
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(user3, 10 ether);
    }
    
    function testInitialState() public view {
        // Check ticket types are initialized correctly
        (
            string memory name, 
            uint256 maxSupply, 
            uint256 currentSupply, 
            uint256 price, 
            uint256 earlyBirdPrice, 
            uint256 whitelistPrice, 
            bool active
        ) = evento.ticketTypesArray(0);
        
        assertEq(name, "COMMON");
        assertEq(maxSupply, 1000);
        assertEq(currentSupply, 0);
        assertEq(price, 0.1 ether);
        assertEq(earlyBirdPrice, 0.08 ether);
        assertEq(whitelistPrice, 0.05 ether);
        assertTrue(active);
        
        // Check sale states
        assertFalse(evento.saleActive());
        assertFalse(evento.earlyBirdActive());
        assertFalse(evento.whitelistActive());
        assertFalse(evento.eventCancelled());
        
      
    }
    
    function testActivateSale() public {
        // Activate sale
        evento.setSaleActive(true);
        assertTrue(evento.saleActive());
        
        // Activate early bird
        evento.setEarlyBirdActive(true);
        assertTrue(evento.earlyBirdActive());
    }
    
    function testPurchaseTickets() public {
        // Activate sale
        evento.setSaleActive(true);
        
        // Purchase as user1
        vm.startPrank(user1);
        uint256 ticketAmount = 2;
        uint256 ticketPrice = 0.1 ether;
        uint256 totalCost = ticketAmount * ticketPrice;
        
        evento.purchaseTickets{value: totalCost}(
            0,
            ticketAmount,
            ""
        );
        
        // Check balance
        assertEq(evento.balanceOf(user1, 0), ticketAmount);
        
        // Check supply updated
        (string memory name,,uint256 currentSupply,,,,) = evento.ticketTypesArray(0);
        assertEq(name, "COMMON");
        assertEq(currentSupply, ticketAmount);
        
        // Check purchase price recorded
        
        vm.stopPrank();
    }
    
    function testEarlyBirdPurchase() public {
        // Activate sale and early bird
        evento.setSaleActive(true);
        evento.setEarlyBirdActive(true);
        
        // Purchase as user1
        vm.startPrank(user1);
        uint256 ticketAmount = 1;
        uint256 earlyBirdPrice = 0.08 ether;
        
        evento.purchaseTickets{value: earlyBirdPrice}(
            0,
            ticketAmount,
            ""
        );
        
        // Check purchase price recorded is early bird price
       
        vm.stopPrank();
    }
    
    function testFailPurchaseInactiveSale() public {
        // Sale not active
        vm.startPrank(user1);
        evento.purchaseTickets{value: 0.1 ether}(
            0,
            1,
            ""
        );
        vm.stopPrank();
    }
    
    function testDiscountCode() public {
        // Add discount code (50% off)
        string memory code = "HALFOFF";
        uint256 discountPercentage = 50;
        evento.addDiscountCode(code, discountPercentage);
        
        // Activate sale
        evento.setSaleActive(true);
        
        // Purchase with discount code
        vm.startPrank(user1);
        uint256 ticketAmount = 1;
        uint256 regularPrice = 0.1 ether;
        uint256 discountedPrice = regularPrice * (100 - discountPercentage) / 100; // 0.05 ether
        
        evento.purchaseTickets{value: discountedPrice}(
            0,
            ticketAmount,
            code
        );
        
        // Check purchase price recorded is discounted price
        vm.stopPrank();
    }
    

    function testTranfer() public {
        uint256 ticketAmount = 2;
        uint256 ticketPrice = 0.1 ether;
        uint256 totalCost = ticketAmount * ticketPrice;
        evento.setSaleActive(true);
        
        vm.startPrank(user1);
        evento.purchaseTickets{value: totalCost}(
            0,
            ticketAmount,
            ""
        );
        // evento.setApprovalForAll(address(this), true);
        evento.safeTransferFrom(user1, user2, 0, 1, "");
        vm.stopPrank();
        assertEq(evento.balanceOf(user1, 0), 1);
        assertEq(evento.balanceOf(user2, 0), 1);
        
    }
    function testBuyOferta() public {
        uint256 ticketAmount = 2;
        uint256 ticketPrice = 0.1 ether;
        uint256 totalCost = ticketAmount * ticketPrice;
        evento.setSaleActive(true);
        vm.startPrank(user1);
         evento.purchaseTickets{value: totalCost}(
            0,
            ticketAmount,
            ""
        );
        evento.createOferta(1, 0.4 ether);
       // evento.setApprovalForAll(address(this), true);
        vm.stopPrank();
        vm.startPrank(user2);
        evento.buyOferta{value: 0.4 ether}(0, 1);
        vm.stopPrank();
        assertEq(evento.balanceOf(user2, 0), 1);
        assertEq(evento.balanceOf(user1, 0), 1);
        (, uint256 id, uint256 amount, ,) = evento.ofertas(0);
        assertEq(id, 0);
        assertEq(amount, 0);

        console.log(user1.balance);
        console.log(user2.balance);
        console.log(address(evento).balance);
        
    }

    function testBuyOfertaTo() public {
        uint256 ticketAmount = 2;
        uint256 ticketPrice = 0.1 ether;
        uint256 totalCost = ticketAmount * ticketPrice;
        evento.setSaleActive(true);
        vm.startPrank(user1);
         evento.purchaseTickets{value: totalCost}(
            0,
            ticketAmount,
            ""
        );
        evento.createOferta(1, 0.4 ether);
        evento.setApprovalForAll(user2, true);
        vm.stopPrank();
        vm.startPrank(user2);
        evento.buyOfertaTo{value: 0.4 ether}(0, 1, user3);
        vm.stopPrank();
        assertEq(evento.balanceOf(user1, 0), 1);
        assertEq(evento.balanceOf(user2, 0), 0);
        assertEq(evento.balanceOf(user3, 0), 1);

        console.log(user1.balance);
        console.log(user2.balance);
        console.log(user3.balance);
        console.log(address(evento).balance);


    }
    function testUpdateTicketPrice() public {
        // Initial prices
        (,,, uint256 initialPrice, uint256 initialEarlyBirdPrice,,) = 
        evento.ticketTypesArray(0);
        
        // Set new prices
        uint256 newPrice = 0.4 ether;
        uint256 newEarlyBirdPrice = 0.3 ether;
        uint256 newWhitelistPrice = 0.2 ether;
        
        evento.setTicketPrices(0, newPrice, newEarlyBirdPrice, newWhitelistPrice);
        
        // Check prices were updated
        (,,, uint256 updatedPrice, uint256 updatedEarlyBirdPrice,,) = evento.ticketTypesArray(0);
        
        assertEq(updatedPrice, newPrice, "Regular price not updated correctly");
        assertEq(updatedEarlyBirdPrice, newEarlyBirdPrice, "Early bird price not updated correctly");
        assertFalse(initialPrice == updatedPrice, "Price should have changed");
        assertFalse(initialEarlyBirdPrice == updatedEarlyBirdPrice, "Early bird price should have changed");
    }
    
    function testFailExceedMaxSupply() public {
        // Activate sale
        evento.setSaleActive(true);
        
        // Get max supply
        (, uint256 maxSupply,,,,,) = evento.ticketTypesArray(0);
        
        // Try to purchase more than max supply
        vm.startPrank(user1);
        uint256 ticketPrice = 0.5 ether;
        
        evento.purchaseTickets{value: ticketPrice * (maxSupply + 1)}(
            0,
            maxSupply + 1,
            ""
        );
        vm.stopPrank();
    }
    
    receive() external payable {}
}
