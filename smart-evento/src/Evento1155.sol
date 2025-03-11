// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Evento1155
 * @dev Contract for tokenizing event tickets with different tiers, pricing strategies, and sales controls
 */
contract Evento1155 is ERC1155, Ownable, ReentrancyGuard {
    // Ticket configuration
    struct TicketType {
        string name;
        uint256 maxSupply; // Maximum supply for this ticket type
        uint256 currentSupply; // Current minted supply
        uint256 price; // Regular price in wei
        uint256 earlyBirdPrice; // Early bird price in wei
        uint256 whitelistPrice; // Whitelist price in wei
        bool active; // Whether this ticket type is active
    }
    TicketType[] public ticketTypesArray; // Ticket type names
    // Sale configuration
    bool public saleActive;
    bool public earlyBirdActive;
    bool public whitelistActive;
    bool public eventCancelled;

    // Ofertas
    struct Oferta {
        address owner;
        uint256 id;
        uint256 amount;
        uint256 price;
        bool active;
    }
    Oferta[] public ofertas;

    // Whitelist mapping for direct address checks
    mapping(address => bool) public whitelist;
    // Discount codes
    mapping(bytes32 => uint256) public discountCodes; // hash(code) => discount percentage (out of 100)
    // Events
    event TicketPurchased(
        address indexed buyer,
        uint256 indexed ticketType,
        uint256 amount,
        uint256 price
    );
    event SaleWindowUpdated(bool active);
    event EarlyBirdWindowUpdated(bool active);
    event WhitelistWindowUpdated(bool active);
    event TicketPriceUpdated(
        uint256 indexed ticketType,
        uint256 newPrice,
        uint256 newEarlyBirdPrice,
        uint256 newWhitelistPrice
    );
    event DiscountCodeAdded(bytes32 codeHash, uint256 discountPercentage);

    /**
     * @dev Constructor initializes the contract with base URI and ticket configurations
     * @param _uri Base URI for token metadata
     */
    constructor(string memory _uri) ERC1155(_uri) Ownable(msg.sender) {
        // Sales windows start inactive
        saleActive = false;
        earlyBirdActive = false;
        whitelistActive = false;
        eventCancelled = false;
    }

    /**
     * @dev Modifier to check if sales are active
     */
    modifier salesOpen() {
        require(saleActive, "Sales are not active");
        _;
    }

    function addTicketType(
        string memory name,
        uint256 maxSupply,
        uint256 price,
        uint256 earlyBirdPrice,
        uint256 whitelistPrice,
        bool active
    ) external onlyOwner {
        TicketType memory newTicketType = TicketType(
            name,
            maxSupply,
            0,
            price,
            earlyBirdPrice,
            whitelistPrice,
            active
        );
        ticketTypesArray.push(newTicketType);
    }

    function getTicketType(
        uint256 index
    )
        external
        view
        returns (
            string memory name,
            uint256 maxSupply,
            uint256 currentSupply,
            uint256 price,
            uint256 earlyBirdPrice,
            uint256 whitelistPrice,
            bool active
        )
    {
        TicketType memory ticketType = ticketTypesArray[index];
        return (
            ticketType.name,
            ticketType.maxSupply,
            ticketType.currentSupply,
            ticketType.price,
            ticketType.earlyBirdPrice,
            ticketType.whitelistPrice,
            ticketType.active
        );
    }

    function updateTicketType(
        uint256 index,
        string memory name,
        uint256 maxSupply,
        uint256 price,
        uint256 earlyBirdPrice,
        uint256 whitelistPrice,
        bool active
    ) external onlyOwner {
        ticketTypesArray[index] = TicketType(
            name,
            maxSupply,
            0,
            price,
            earlyBirdPrice,
            whitelistPrice,
            active
        );
    }

    /**
     * @dev Sets approval for all tokens of a specific operator
     * @param operator Address to approve or revoke approval from
     * @param approved True to approve, false to revoke approval
     */
    function setApprovalForAll(
        address operator,
        bool approved
    ) public override {
        super.setApprovalForAll(operator, approved);
    }

    /**
     * @dev Creates a new oferta
     * @param amount The amount of tickets in the oferta
     * @param price The price of the oferta
     */
    function createOferta(uint256 amount, uint256 price) external {
        ofertas.push(Oferta(msg.sender, ofertas.length, amount, price, true));
    }

    /**
     * @dev Gets all ofertas
     * @return ofertas The array of ofertas
     */
    function getOfertas() external view returns (Oferta[] memory) {
        return ofertas;
    }

    function buyOferta(uint256 ofertaId, uint256 amount) external payable {
        Oferta memory oferta = ofertas[ofertaId];
        require(oferta.active, "Oferta no activa");
        require(
            oferta.amount >= amount,
            "No hay suficientes tickets disponibles"
        );
        require(oferta.price * amount <= msg.value, "El pago es insuficiente");
        require(msg.value > 0, "El pago debe ser mayor que cero");
        require(
            oferta.owner != msg.sender,
            "El comprador no puede ser el creador de la oferta"
        );
        require(oferta.amount > 0, "No hay tickets disponibles");
        require(
            oferta.price > 0,
            "El precio de la oferta debe ser mayor que cero"
        );

        oferta.amount -= amount;
        // Transfer the tickets from the oferta creator to the buyer

        _safeTransferFrom(oferta.owner, msg.sender, oferta.id, amount, "");
        // Update the oferta in storage
        ofertas[ofertaId] = oferta;
        // Transfer payment to the seller
        (bool success, ) = oferta.owner.call{value: oferta.price * amount}("");
        require(success, "Payment transfer failed");
        if (msg.value > oferta.price * amount) {
            payable(msg.sender).transfer(msg.value - oferta.price * amount);
        }
    }

    function buyOfertaTo(
        uint256 ofertaId,
        uint256 amount,
        address buyer
    ) external payable {
        Oferta memory oferta = ofertas[ofertaId];
        require(oferta.active, "Oferta no activa");
        require(
            oferta.amount >= amount,
            "No hay suficientes tickets disponibles"
        );
        require(oferta.price * amount <= msg.value, "El pago es insuficiente");
        require(buyer != address(0), "El comprador no puede ser cero");
        require(
            buyer != oferta.owner,
            "El comprador no puede ser el creador de la oferta"
        );
        require(oferta.amount > 0, "No hay tickets disponibles");
        require(
            oferta.price > 0,
            "El precio de la oferta debe ser mayor que cero"
        );
        // This require statement is redundant as the _safeTransferFrom function already checks
        // if the sender is approved to transfer tokens from the owner.
        // The ERC1155 implementation in _safeTransferFrom will verify that either:
        // 1. msg.sender is the owner of the tokens, or
        // 2. msg.sender is approved by the owner via setApprovalForAll
        // So we can safely remove this require statement.
        require(
            isApprovedForAll(oferta.owner, msg.sender),
            "No tienes permisos para transferir tokens de la oferta"
        );
        _safeTransferFrom(oferta.owner, buyer, oferta.id, amount, "");
        oferta.amount -= amount;
        ofertas[ofertaId] = oferta;

        // payable transfer from buyer to oferta owner  devolver el restor

        uint256 totalCost = oferta.price * amount;
        (bool success, ) = oferta.owner.call{value: oferta.price * amount}("");
        require(success, "Payment transfer failed");
        if (msg.value > totalCost) {
            payable(buyer).transfer(msg.value - totalCost);
        }
    }

    /**
     * @dev Checks if an operator is approved for all tokens of an owner
     * @param account Owner of the tokens
     * @param operator Address to check approval status
     * @return bool True if the operator is approved, false otherwise
     */
    function isApprovedForAll(
        address account,
        address operator
    ) public view override returns (bool) {
        return super.isApprovedForAll(account, operator);
    }

    /**
     * @dev Purchase tickets
     * @param ticketType Type of ticket to purchase
     * @param amount Number of tickets to purchase
     * @param discountCode Optional discount code (empty string for no discount)
     */
    function purchaseTickets(
        uint256 ticketType,
        uint256 amount,
        string memory discountCode
    ) external payable salesOpen nonReentrant {
        require(ticketTypesArray[ticketType].active, "Ticket type not active");
        require(amount > 0, "Amount must be greater than zero");
        require(
            ticketTypesArray[ticketType].currentSupply + amount <=
                ticketTypesArray[ticketType].maxSupply,
            "Not enough tickets available"
        );

        // Calculate price
        uint256 basePrice;
        if (earlyBirdActive) {
            basePrice = ticketTypesArray[ticketType].earlyBirdPrice;
        } else {
            basePrice = ticketTypesArray[ticketType].price;
        }

        // Apply discount if code provided
        uint256 finalPrice = basePrice;
        if (bytes(discountCode).length > 0) {
            bytes32 codeHash = keccak256(abi.encodePacked(discountCode));
            uint256 discountPercentage = discountCodes[codeHash];
            require(discountPercentage > 0, "Invalid discount code");

            finalPrice = (basePrice * (100 - discountPercentage)) / 100;
        }
        // Check whitelist if whitelist is active
        if (whitelistActive && !whitelist[msg.sender]) {
            // Check if user is in the whitelist
            finalPrice = ticketTypesArray[ticketType].whitelistPrice;
        }

        uint256 totalCost = finalPrice * amount;
        require(msg.value >= totalCost, "Insufficient payment");

        // Mint tickets
        _mint(msg.sender, ticketType, amount, "");

        // Update supply
        ticketTypesArray[ticketType].currentSupply += amount;

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit TicketPurchased(msg.sender, ticketType, amount, finalPrice);
    }
    /**
     * @dev Set ticket prices
     * @param ticketType Type of ticket to update
     * @param newPrice New regular price
     * @param newEarlyBirdPrice New early bird price
     */
    function setTicketPrices(
        uint256 ticketType,
        uint256 newPrice,
        uint256 newEarlyBirdPrice,
        uint256 newWhitelistPrice
    ) external onlyOwner {
        require(
            newEarlyBirdPrice <= newPrice,
            "Early bird price must be less than or equal to regular price"
        );

        ticketTypesArray[ticketType].price = newPrice;
        ticketTypesArray[ticketType].earlyBirdPrice = newEarlyBirdPrice;
        ticketTypesArray[ticketType].whitelistPrice = newWhitelistPrice;
        emit TicketPriceUpdated(
            ticketType,
            newPrice,
            newEarlyBirdPrice,
            newWhitelistPrice
        );
    }

    /**
     * @dev Set sale window status
     * @param _active Whether the sale window is active
     */
    function setSaleActive(bool _active) external onlyOwner {
        saleActive = _active;
        emit SaleWindowUpdated(_active);
    }

    /**
     * @dev Set early bird window status
     * @param _active Whether the early bird window is active
     */
    function setEarlyBirdActive(bool _active) external onlyOwner {
        earlyBirdActive = _active;
        emit EarlyBirdWindowUpdated(_active);
    }

    /**
     * @dev Set whitelist status
     * @param _active Whether whitelist is active
     */
    function setWhitelistActive(bool _active) external onlyOwner {
        whitelistActive = _active;
        emit WhitelistWindowUpdated(_active);
    }

    /**
     * @dev Add or update a discount code
     * @param code Discount code string
     * @param discountPercentage Discount percentage (out of 100)
     */
    function addDiscountCode(
        string calldata code,
        uint256 discountPercentage
    ) external onlyOwner {
        require(
            discountPercentage > 0 && discountPercentage <= 100,
            "Invalid discount percentage"
        );

        bytes32 codeHash = keccak256(abi.encodePacked(code));
        discountCodes[codeHash] = discountPercentage;

        emit DiscountCodeAdded(codeHash, discountPercentage);
    }

    /**
     * @dev Withdraw contract funds (only owner)
     */
    function withdraw() external onlyOwner {
        require(!eventCancelled, "Cannot withdraw after event cancellation");
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Add a single address to the whitelist
     * @param _address Address to add to whitelist
     * @notice This is a convenience function for adding individual addresses
     * @notice For larger whitelists, use the merkle tree approach with setWhitelistMerkleRoot
     */
    function addToWhitelist(address _address) external onlyOwner {
        whitelist[_address] = true;
    }

    /**
     * @dev Remove an address from the whitelist
     * @param _address Address to remove from whitelist
     * @notice This is a convenience function for removing individual addresses
     * @notice For larger whitelists, use the merkle tree approach with setWhitelistMerkleRoot
     */
    function removeFromWhitelist(address _address) external onlyOwner {
        whitelist[_address] = false;
    }

    /**
     * @dev Get the whitelist status for an address
     * @param _address Address to check whitelist status for
     * @return true if the address is whitelisted, false otherwise
     */
    function isWhitelisted(address _address) external view returns (bool) {
        return whitelist[_address];
    }

    /**
     * @dev Override ERC1155 _update to check if event is cancelled
     */
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal override {
        // Call the parent implementation of _beforeTokenTransfer
        // This ensures that any checks or logic in the parent contract's implementation are executed
        // The ERC1155 implementation may include important validation or state updates
        super._update(from, to, ids, amounts);

        // Prevent transfers if event is cancelled (except for burns during refunds)
        if (eventCancelled && to != address(0)) {
            revert("Transfers disabled after event cancellation");
        }
    }
}
