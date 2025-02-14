import assert from "assert";
import { 
  TestHelpers,
  ERC1967Proxy_AdminChanged
} from "generated";
const { MockDb, ERC1967Proxy } = TestHelpers;

describe("ERC1967Proxy contract AdminChanged event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ERC1967Proxy contract AdminChanged event
  const event = ERC1967Proxy.AdminChanged.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ERC1967Proxy_AdminChanged is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ERC1967Proxy.AdminChanged.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualERC1967ProxyAdminChanged = mockDbUpdated.entities.ERC1967Proxy_AdminChanged.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedERC1967ProxyAdminChanged: ERC1967Proxy_AdminChanged = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      previousAdmin: event.params.previousAdmin,
      newAdmin: event.params.newAdmin,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualERC1967ProxyAdminChanged, expectedERC1967ProxyAdminChanged, "Actual ERC1967ProxyAdminChanged should be the same as the expectedERC1967ProxyAdminChanged");
  });
});
