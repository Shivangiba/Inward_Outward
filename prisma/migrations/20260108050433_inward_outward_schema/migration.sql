-- CreateTable
CREATE TABLE "InwardOutwardOffice" (
    "id" SERIAL NOT NULL,
    "officeName" VARCHAR(250) NOT NULL,
    "instituteId" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "openingDate" TIMESTAMP(3) NOT NULL,
    "openingInwardNo" INTEGER NOT NULL,
    "openingOutwardNo" INTEGER NOT NULL,
    "remarks" VARCHAR(500),
    "userId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InwardOutwardOffice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InOutwardFromTo" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sequence" DECIMAL(65,30),
    "remarks" VARCHAR(500),
    "userId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "personName" VARCHAR(100),
    "address" VARCHAR(250),
    "place" VARCHAR(100),

    CONSTRAINT "InOutwardFromTo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InOutwardMode" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sequence" DECIMAL(65,30),
    "remarks" VARCHAR(500),
    "userId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InOutwardMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourierCompany" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "contactPersonName" VARCHAR(100),
    "defaultRate" DECIMAL(65,30),
    "remarks" VARCHAR(500),
    "userId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "phoneNo" VARCHAR(50),
    "email" VARCHAR(50),
    "website" VARCHAR(50),
    "address" VARCHAR(500),

    CONSTRAINT "CourierCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inward" (
    "id" SERIAL NOT NULL,
    "inwardNo" VARCHAR(50) NOT NULL,
    "inwardDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3),
    "outwardId" INTEGER,
    "inOutwardModeId" INTEGER,
    "receiptNo" VARCHAR(100),
    "receiptDate" TIMESTAMP(3),
    "inwardLetterNo" VARCHAR(100),
    "inwardLetterDate" TIMESTAMP(3),
    "subject" TEXT,
    "description" VARCHAR(500),
    "inOutwardFromToId" INTEGER,
    "letterFromName" VARCHAR(100),
    "letterFromAddress" VARCHAR(500),
    "instituteId" INTEGER,
    "departmentId" INTEGER,
    "toPersonName" VARCHAR(100),
    "inwardDocumentPath" VARCHAR(250),
    "remarks" VARCHAR(500),
    "userId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "courierCompanyName" VARCHAR(100),
    "noOfCompilation" VARCHAR(250),
    "copyTo" VARCHAR(250),
    "fromContactDetails" VARCHAR(250),
    "fromInwardOutwardOfficeId" INTEGER,
    "toInwardOutwardOfficeId" INTEGER NOT NULL,
    "internalOutwardId" INTEGER,
    "finYearId" INTEGER NOT NULL,
    "subjectShort" VARCHAR(100),
    "otherInstitute" VARCHAR(150),

    CONSTRAINT "Inward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outward" (
    "id" SERIAL NOT NULL,
    "outwardNo" VARCHAR(50) NOT NULL,
    "outwardDate" TIMESTAMP(3) NOT NULL,
    "inwardId" INTEGER,
    "instituteId" INTEGER,
    "departmentId" INTEGER,
    "outwardByPerson" VARCHAR(100),
    "inOutwardFromToId" INTEGER,
    "letterForwardedToName" VARCHAR(500),
    "letterForwardedToAddress" VARCHAR(250),
    "letterForwardedToPlace" VARCHAR(100),
    "inOutwardModeId" INTEGER,
    "letterNo" VARCHAR(100),
    "letterDate" TIMESTAMP(3),
    "subject" VARCHAR(250),
    "courierReceiptNo" VARCHAR(100),
    "courierReceiptDate" TIMESTAMP(3),
    "amount" DECIMAL(65,30),
    "amountPaidType" VARCHAR(10),
    "courierReceiptPath" VARCHAR(250),
    "courierAcknowledgePath" VARCHAR(250),
    "outwardDocumentPath" VARCHAR(250),
    "remarks" VARCHAR(500),
    "userId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified" TIMESTAMP(3) NOT NULL,
    "isReturned" BOOLEAN NOT NULL DEFAULT false,
    "returnReason" VARCHAR(500),
    "returnAction" VARCHAR(500),
    "noOfCompilation" VARCHAR(250),
    "courierCompanyId" INTEGER,
    "copyTo" VARCHAR(250),
    "toContactDetails" VARCHAR(250),
    "returnDate" TIMESTAMP(3),
    "fromInwardOutwardOfficeId" INTEGER NOT NULL,
    "toInwardOutwardOfficeId" INTEGER,
    "finYearId" INTEGER NOT NULL,
    "fileNo" VARCHAR(50),
    "smsToCsv" VARCHAR(250),
    "emailToCsv" VARCHAR(250),
    "subjectShort" VARCHAR(100),
    "otherInstitute" VARCHAR(150),
    "charges" DECIMAL(65,30),
    "trackingId" VARCHAR(50),
    "deliveryStatus" VARCHAR(50),

    CONSTRAINT "Outward_pkey" PRIMARY KEY ("id")
);
