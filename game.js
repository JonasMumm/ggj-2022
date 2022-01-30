const StartSegmentIndex = 0;

let constData;
let stashAnchors;
let currentActiveBlocks;
let currentSegmentIndex;

function initGame()
{   
    currentSegmentIndex = 0;
    constData = GetGameData();
    //$(".storyscroller").html(constData[0].processedHtml );
    //$("#"+constData[0].wordblockAnchors[0].anchorId).html("Iddd");

    for(let i=0; i<=StartSegmentIndex; i++)
    {
        InitLevel(i);
    }
}

function InitLevel(levelIndex)
{
    var scrollPos = GetCurrentYScrollPosition();
    MaybeDeactivateLevel(levelIndex-1);
    currentSegmentIndex = levelIndex;
    ClearAllBottomBarAnchors();
    PopulateBottomBar(constData[levelIndex]);
    DisplaySegment(constData[levelIndex]);
    HandleButtonEnabledState();
    ScrollFromTo(scrollPos,GetScrollTargetForSegment(levelIndex), 0.5);
}

function MaybeDeactivateLevel(levelIndex)
{
    if(levelIndex<0) return;

    const segment = constData[levelIndex];
    currentActiveBlocks.forEach(element => {
        const domElement = $("#"+element.blockId);
        domElement.removeClass("activeWordblock");
        domElement.attr("draggable","false");
    });
}

function DisplaySegment(segment)
{
    var rootElement = document.getElementById(segment.rootElementId);
    rootElement.classList.remove("hiddenStorySegment");
    rootElement.style.opacity = 1;
}

function PopulateBottomBar(segment)
{
    stashAnchors = [];
    currentActiveBlocks = [];

    for(var i = segment.templates.length-1; i>=0; i--)
    {
        $("#wordstash").prepend(" ");
        var template = segment.templates[i];
        var newSource = $("#prefabWordblockAnchor").clone().prependTo("#wordstash");
        var newAnchorId = "stashAnchor_"+segment.index+"_"+i+"_"+template.templateString;
        var newBlockId = "block_"+segment.index+"_"+i+"_"+template.templateString;
        newSource.attr("id",newAnchorId);
        stashAnchors.push({"anchorId": newAnchorId, "templateString": template.templateString, "currentBlockId": newBlockId });

        var newWordblock = $("#prefabWordblock").clone().appendTo("#"+newAnchorId);
        //newWordblock.append("<div>"+template.templateString+"</div>").addClass("noselect");
        newWordblock.addClass("activeWordblock");
        var newTextId = newBlockId+"Text";
        var innerText = document.createElement("div");
        //innerText.classList.add("noselect");
        innerText.id = newTextId;
        innerText.innerText = template.templateString;
        newWordblock.attr("draggable","true");
        newWordblock.attr("ondragstart","dragStart(event)");
        newWordblock.attr("id",newBlockId);
        //newWordblock.append("#"+newTextId); //TODO: This wholw bit is wrong and weird, but is working somehow.
        newWordblock.append(template.templateString);
        //$("#"+newBlockId).append($("#"+newTextId));


        currentActiveBlocks.push({
            "templateString": template.templateString,
            "blockId": newBlockId,
            "currentAnchorId" : newAnchorId
        });
    }
}

function dragStart(ev) 
{
    ev.dataTransfer.setData("targetId", ev.target.id);
    console.log(ev.target.id);
}

function dragAllowDropOnActiveAnchors(ev) 
{
    const dragTargetId = ev.toElement.id;

    const currentSegment = constData[currentSegmentIndex]; 

    const anchorIndexIfTarget = currentSegment.wordblockAnchors.findIndex(element=>{
        return element.anchorId == dragTargetId;
    });

    if(anchorIndexIfTarget>=0)
    {
        ev.preventDefault();
    }
}

function dragAllowDrop(ev) 
{
    ev.preventDefault();
}

function dropOnWordstash(ev)
{
    var blockId = ev.dataTransfer.getData("targetId");

    console.log("Block: "+blockId);
    console.log(ev);

    var indexOfAnchorWhoHasThisBlockInStash = stashAnchors.findIndex(element => element.currentBlockId == blockId);

    if(indexOfAnchorWhoHasThisBlockInStash >=0)
    {
        console.log("Block already in stash, not dropping");
        return;
    }

    var anchorData = stashAnchors.find(element => element.currentBlockId == null);
    var anchorId = anchorData.anchorId;
    var anchor = document.getElementById(anchorId);
    anchor.appendChild(document.getElementById(blockId));

    const blockData = currentActiveBlocks.find(element=>element.blockId == blockId);
    RemoveBlockFromAnchor(blockData.currentAnchorId);
    blockData.currentAnchorId = anchorId;

    anchorData.currentBlockId = blockId;

    HandleButtonEnabledState();
}

function dropOnSegmentAnchor(ev)
{
    console.log("DROP");

    const dragTargetId = ev.toElement.id;

    const currentSegment = constData[currentSegmentIndex]; 

    const anchorIndexIfTarget = currentSegment.wordblockAnchors.findIndex(element=>{
        return element.anchorId == dragTargetId;
    });

    if(anchorIndexIfTarget<0)
    {
        console.error("This can't be happening!");
    }

    var blockId = ev.dataTransfer.getData("targetId");
    var anchor = ev.target;
    var anchorId = ev.target.id;
    anchor.appendChild(document.getElementById(blockId));

    const blockData = currentActiveBlocks.find(element=>element.blockId == blockId);
    RemoveBlockFromAnchor(blockData.currentAnchorId);
    console.log("PrevAnchor: "+blockData.currentAnchorId);
    blockData.currentAnchorId = anchorId;
    console.log("NewAnchor: "+currentActiveBlocks.find(element=>element.blockId == blockId).currentAnchorId);

    const anchorData = FindActiveAnchorById(anchorId);
    console.log("PrevBlock: "+anchorData.currentBlockId);
    anchorData.currentBlockId = blockId;
    console.log("NewBlock: "+currentSegment.wordblockAnchors[anchorIndexIfTarget].currentBlockId);

    HandleButtonEnabledState();
}

function FindActiveAnchorById(anchorId)
{
    const currentSegment = constData[currentSegmentIndex]; 
    const segmentAnchorIndexIfTarget = currentSegment.wordblockAnchors.findIndex(element=>{
        return element.anchorId == anchorId;
    });

    if(segmentAnchorIndexIfTarget>=0)
    {
        return currentSegment.wordblockAnchors[segmentAnchorIndexIfTarget];
    }

    const stashAnchorIndexIfTarget = stashAnchors.findIndex(element=>{
        return element.anchorId == anchorId;
    });

    if(stashAnchorIndexIfTarget>=0)
    {
        return stashAnchors[stashAnchorIndexIfTarget];
    }

    console.error("Couldnt find active anchor for "+anchorId);
}

function RemoveBlockFromAnchor(anchorId)
{
    const anchor = FindActiveAnchorById(anchorId);
    anchor.currentBlockId = null;
}

function ClearAllBottomBarAnchors()
{
    $("#wordstash").html("");
}

function GetGameData()
{
    const str = $("#gamedata").html();
    const splits = str.split('♻️');
    let segments = [];

    for(var i = 0; i<splits.length; i++)
    {
        let segmentStr = splits[i];
        let segment = {"index": i, "rawHtml": segmentStr };
        let templates = [];
        let hasFoundAllTemplates = false;
        let currentIndex = 0;

        while(!hasFoundAllTemplates)
        {
            let nextStartBraceIndex = segmentStr.indexOf('[', currentIndex);
            if(nextStartBraceIndex == -1)
            {
                hasFoundAllTemplates = true;
                break;
            }

            let endBraceIndex = segmentStr.indexOf(']', nextStartBraceIndex);
            let teplateString = segmentStr.substring(nextStartBraceIndex+1,endBraceIndex);

            templates.push({
                "startBraceIndex" : nextStartBraceIndex,
                "endBraceIndex" : endBraceIndex,
                "templateString" : teplateString
            })

            currentIndex = endBraceIndex;
        }

        segment.templates = templates;
        
        ProcessHtml(segment);
        segment.templates.sort(templateCompare); //cant be done eralier as ProcessHtml relies on order of occurence.
        console.log(segment.templates);
        var rootId = "story_segment_"+i;
        segment.rootElementId = rootId;
        var rootElem = document.createElement("div");
        rootElem.id=("id", rootId);
        rootElem.classList.add("storySegment");
        rootElem.classList.add("hiddenStorySegment");
        rootElem.style.opacity = 0;
        $(".storyscroller").append(rootElem);
        $(".storyscroller").append("<div id="+rootId+"></div>");
        $("#"+rootId).html(segment.processedHtml );
        segments.push(segment);
    }
    
    console.log(segments);
    return segments;

    function templateCompare( a, b ) {
        if ( a.templateString.toLowerCase() < b.templateString.toLowerCase() ){
          return -1;
        }
        if ( a.templateString.toLowerCase() > b.templateString.toLowerCase() ){
          return 1;
        }
        return 0;
      }
}

function ProcessHtml(segment)
{
    var wordblockAnchors = [];
    var curString = segment.rawHtml;

    for(var i = segment.templates.length-1; i>=0; i--)
    {
        var template = segment.templates[i];
        var newElement = $("#prefabWordblockAnchor").clone();
        var newId = "wordblockAnchor_"+segment.index+"_"+i+"_"+template.templateString;
        newElement.attr("id",newId);
        newElement.addClass("wordblockAnchorForceOpen");
        newElement.attr("ondragover","dragAllowDropOnActiveAnchors(event)");
        newElement.attr("ondrop","dropOnSegmentAnchor(event)");
        var newElementHtml = newElement.prop('outerHTML');
        curString = curString.substring(0,template.startBraceIndex) + newElementHtml + curString.substring(template.endBraceIndex+1);
        wordblockAnchors.push({"anchorId": newId, "templateString": template.templateString, "currentBlockId": null });
    }

    segment.processedHtml = curString;
    segment.wordblockAnchors = wordblockAnchors;
}

function onNextButtonClicked()
{
    GetCurrentYScrollPosition();
    console.log(GetScrollTargetForSegment(0));
    InitLevel(currentSegmentIndex+1);
}

function GetCurrentYScrollPosition()
{
    var el = document.getElementById("storycontainer"); // Or whatever method to get the element
    return el.scrollTop;
}

function GetScrollTargetForSegment(segmentIndex)
{
    var rootId = constData[segmentIndex].rootElementId;
    segmentEl = document.getElementById(rootId);
    scrollerEl = document.getElementById("storycontainer");

    var segTop = segmentEl.offsetTop;
    var segHeight = segmentEl.offsetHeight;

    var scrollerVpHeight = scrollerEl.offsetHeight;
    return segTop - scrollerVpHeight +segHeight;
}

function ScrollFromTo(start, end, time)
{
    var scroller = document.getElementById("storycontainer"); // Or whatever method to get the element
    var interv=setInterval(DoScroll,1/60 * 1000);

    setTimeout(EndScroll, time* 1000);
    let dt =0;
    function DoScroll()
    {
        dt += 1/60;
        var progress = Math.sqrt(dt/time)
        SetScroll(start + (end-start)*progress);
    }

    function EndScroll()
    {
        SetScroll(end);
        clearInterval(interv);
    }

    function SetScroll(pos)
    {
        scroller.scrollTop = pos;
    }
}

function HandleButtonEnabledState()
{
    var indexOfStashThatHasABlock = stashAnchors.findIndex(element => element.currentBlockId != null);

    console.log("HandleButtonEnabledState "+indexOfStashThatHasABlock);

    var isButtonEnabled = indexOfStashThatHasABlock == -1 && currentSegmentIndex < constData.length-1;

    $(".continuebuttonbutton").attr("disabled", !isButtonEnabled);
}