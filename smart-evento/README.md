# Smart Evento - ERC1155 Event Ticketing System

Smart Evento is a blockchain-based event ticketing system built on Ethereum using the ERC1155 token standard. This system allows event organizers to create, manage, and sell tickets with various tiers and pricing strategies.

## Features

- **Multiple Ticket Types**: Create different ticket tiers (Common, VIP, Premium, etc.) with customizable properties
- **Flexible Pricing Strategies**: Support for regular pricing, early bird discounts, and whitelist pricing
- **Secondary Market**: Built-in marketplace for ticket reselling through the Oferta system
- **Access Control**: Owner-only administrative functions for event management
- **Security**: Implements reentrancy protection and proper access controls

## Contract Overview

The main contract `Evento1155` inherits from:
- `ERC1155`: For multi-token functionality
- `Ownable`: For access control
- `ReentrancyGuard`: For protection against reentrancy attacks

## Key Structures

### TicketType

```solidity
struct TicketType {
    string name;
    uint256 maxSupply;
    uint256 currentSupply;
    uint256 price;
    uint256 earlyBirdPrice;
    uint256 whitelistPrice;
    bool active;
}
```

### Oferta

```solidity
struct Oferta {
    address owner;
    uint256 id;
    uint256 amount;
    uint256 price;
    bool active;
}
```

## Contract Functions

### Ticket Management

#### createTicketType

```solidity
function createTicketType(
    string memory name,
    uint256 maxSupply,
    uint256 price,
    uint256 earlyBirdPrice,
    uint256 whitelistPrice,
    bool active
) external onlyOwner;
```

#### updateTicketType

```solidity
function updateTicketType(
    uint256 index,
    string memory name,
    uint256 maxSupply,
    uint256 price,
    uint256 earlyBirdPrice,
    uint256 whitelistPrice,
    bool active
) external onlyOwner;
```

#### setTicketPrices

```solidity
function setTicketPrices(
    uint256 index,
    uint256 price,
    uint256 earlyBirdPrice,
    uint256 whitelistPrice
) external onlyOwner;
```

#### setSaleActive  

```solidity
function setSaleActive(bool active) external onlyOwner;
```

#### purchaseTickets

```solidity
function purchaseTickets(
    uint256 ticketType,
    uint256 amount,
) external payable nonReentrant;
```

#### buyOferta

```solidity
function buyOferta(uint256 ofertaId, uint256 amount) external payable nonReentrant;
```

#### buyOfertaTo

```solidity
function buyOfertaTo(uint256 ofertaId, uint256 amount, address to) external payable nonReentrant;
```

#### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) public override;
```

#### createOferta

```solidity
function createOferta(uint256 amount, uint256 price) external;
```

#### getOfertas

```solidity
function getOfertas() external view returns (Oferta[] memory);
```

#### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) public view override returns (bool);
``` 


## compilar smart contract y llevar abi y address a admin. 
Hay que ejecutarlo desde el directorio smart-evento
```bash
forge create --rpc-url http://localhost:8545 \
--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
src/Evento1155.sol:Evento1155 \
--constructor-args "https://example.com/metadata/"src/Evento1155.sol:Evento1155 > \
contrato.txt  && cp ./out/Evento1155.sol/Evento1155.json \
../admin/src/app/abi.json && cat contrato.txt |  grep "Deployed to:" | sed 's/Deployed to: /{"address": "/g' | sed 's/$/"}/' > \
../admin/src/app/contrato.json
```




